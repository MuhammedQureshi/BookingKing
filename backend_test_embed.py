import requests
import sys
import json
from datetime import datetime, date, timedelta

class EmbedWidgetTester:
    def __init__(self, base_url="https://reserve-js.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.embed_url = f"{base_url}/booking-embed.js"
        self.business_id = "9eed6af5-f515-4b3d-a57a-6b3860fe79b9"  # Test business ID from requirements
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.issues = []

    def log_test(self, name, method, endpoint, expected_status, actual_status, success, response_data=None, error=None, details=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ PASS: {name} - {method} {endpoint} - {actual_status}")
            if details:
                print(f"   Details: {details}")
        else:
            print(f"❌ FAIL: {name} - {method} {endpoint}")
            print(f"   Expected: {expected_status}, Got: {actual_status}")
            if error:
                print(f"   Error: {error}")
            if details:
                print(f"   Details: {details}")
            
            self.issues.append({
                "test": name,
                "endpoint": endpoint,
                "issue": error or f"Expected {expected_status}, got {actual_status}",
                "details": details
            })
        
        self.test_results.append({
            "name": name,
            "method": method,
            "endpoint": endpoint,
            "expected_status": expected_status,
            "actual_status": actual_status,
            "success": success,
            "response_data": response_data,
            "error": str(error) if error else None,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.embed_url
        if headers is None:
            headers = {
                'Content-Type': 'application/json',
                'Origin': 'https://external-website.com',  # Test CORS
                'Referer': 'https://external-website.com/booking-page'
            }

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=15)

            success = response.status_code == expected_status
            response_data = None
            try:
                if 'application/json' in response.headers.get('content-type', ''):
                    response_data = response.json()
                else:
                    response_data = response.text[:500] + '...' if len(response.text) > 500 else response.text
            except:
                response_data = response.text[:200] + '...' if len(response.text) > 200 else response.text

            # Check CORS headers for cross-origin requests
            cors_details = None
            if 'Origin' in headers:
                cors_headers = {
                    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                    'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                }
                cors_details = f"CORS headers: {cors_headers}"

            self.log_test(name, method, endpoint, expected_status, response.status_code, success, response_data, None, cors_details)
            return success, response_data, response.status_code, response.headers

        except Exception as e:
            self.log_test(name, method, endpoint, expected_status, 0, False, None, e)
            return False, {}, 0, {}

    def test_embed_script_accessibility(self):
        """Test if embed script is accessible"""
        try:
            response = requests.get(self.embed_url, timeout=15)
            success = response.status_code == 200
            
            if success:
                # Check if it contains the widget code
                content = response.text
                has_widget_code = 'Appointly' in content and 'booking-widget' in content
                has_vanilla_js = 'const ' not in content and 'arrow function' not in content  # Check for ES5 compatibility
                details = f"Size: {len(content)} chars, Contains widget: {has_widget_code}, Vanilla JS: {has_vanilla_js}"
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
            
            self.log_test(
                "Embed Script Accessibility", 
                "GET", 
                "booking-embed.js", 
                200, 
                response.status_code, 
                success,
                response.text[:300] + '...' if len(response.text) > 300 else response.text,
                None,
                details
            )
            return success
        except Exception as e:
            self.log_test("Embed Script Accessibility", "GET", "booking-embed.js", 200, 0, False, None, e)
            return False

    def test_business_public_api(self):
        """Test getting business public info for the test business"""
        success, response_data, status, headers = self.run_test(
            "Get Test Business Public Info",
            "GET",
            f"businesses/{self.business_id}",
            200
        )
        
        if success and isinstance(response_data, dict):
            services_count = len(response_data.get('services', []))
            details = f"Found {services_count} services"
            print(f"   Business: {response_data.get('business_name', 'N/A')}")
            print(f"   Services: {services_count}")
            
            # Store first service for slot testing
            if services_count > 0:
                self.service_id = response_data['services'][0]['id']
                print(f"   Using service ID: {self.service_id}")
        
        return success

    def test_get_available_slots(self):
        """Test getting available slots for the test business"""
        if not hasattr(self, 'service_id'):
            print("⚠️  Skipping slots test - no service_id available")
            return False
            
        tomorrow = (date.today() + timedelta(days=1)).strftime('%Y-%m-%d')
        success, response_data, status, headers = self.run_test(
            "Get Available Slots",
            "GET", 
            f"businesses/{self.business_id}/slots",
            200,
            params={
                "date": tomorrow,
                "service_id": self.service_id
            }
        )
        
        if success and isinstance(response_data, list):
            available_slots = [slot for slot in response_data if slot.get('available', False)]
            details = f"Date: {tomorrow}, Total slots: {len(response_data)}, Available: {len(available_slots)}"
            print(f"   {details}")
            
            if available_slots:
                self.available_slot = available_slots[0]
                print(f"   Using slot: {self.available_slot['start_time']} - {self.available_slot['end_time']}")
        
        return success

    def test_create_booking(self):
        """Test creating a booking through the API"""
        if not hasattr(self, 'service_id') or not hasattr(self, 'available_slot'):
            print("⚠️  Skipping booking test - missing service_id or available_slot")
            return False
            
        tomorrow = (date.today() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        success, response_data, status, headers = self.run_test(
            "Create Test Booking",
            "POST",
            "bookings",
            200,
            {
                "business_id": self.business_id,
                "service_id": self.service_id,
                "date": tomorrow,
                "start_time": self.available_slot['start_time'],
                "customer_name": "Test Customer",
                "customer_email": "test@example.com",
                "customer_phone": "+1234567890"
            }
        )
        
        if success and isinstance(response_data, dict):
            booking_id = response_data.get('id', 'N/A')
            details = f"Booking ID: {booking_id}, Service: {response_data.get('service_name', 'N/A')}"
            print(f"   {details}")
        
        return success

    def test_cors_preflight(self):
        """Test CORS preflight request"""
        try:
            response = requests.options(
                f"{self.api_url}/businesses/{self.business_id}",
                headers={
                    'Origin': 'https://external-website.com',
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Content-Type'
                },
                timeout=15
            )
            
            success = response.status_code in [200, 204]
            cors_allow_origin = response.headers.get('Access-Control-Allow-Origin')
            cors_allow_methods = response.headers.get('Access-Control-Allow-Methods')
            
            details = f"Allow-Origin: {cors_allow_origin}, Allow-Methods: {cors_allow_methods}"
            
            self.log_test(
                "CORS Preflight Request",
                "OPTIONS",
                f"businesses/{self.business_id}",
                [200, 204],
                response.status_code,
                success,
                None,
                None,
                details
            )
            return success
        except Exception as e:
            self.log_test("CORS Preflight Request", "OPTIONS", f"businesses/{self.business_id}", [200, 204], 0, False, None, e)
            return False

    def run_all_tests(self):
        """Run all embed widget tests"""
        print(f"🔍 Testing Embeddable Booking Widget at: {self.base_url}")
        print(f"📋 Using test business ID: {self.business_id}")
        print("=" * 80)
        
        # Test sequence focused on embed functionality
        test_sequence = [
            ("Embed Script", self.test_embed_script_accessibility),
            ("CORS Preflight", self.test_cors_preflight),
            ("Business API", self.test_business_public_api),
            ("Available Slots", self.test_get_available_slots),
            ("Create Booking", self.test_create_booking),
        ]
        
        for test_name, test_func in test_sequence:
            print(f"\n🧪 Running: {test_name}")
            try:
                test_func()
            except Exception as e:
                print(f"❌ Error in {test_name}: {str(e)}")

        # Print summary
        print("\n" + "=" * 80)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed ({(self.tests_passed/self.tests_run*100):.1f}%)")
        
        if self.issues:
            print(f"\n⚠️  Found {len(self.issues)} issues:")
            for issue in self.issues:
                print(f"  • {issue['test']}: {issue['issue']}")
                if issue['details']:
                    print(f"    Details: {issue['details']}")
                    
        return self.tests_passed == self.tests_run

def main():
    tester = EmbedWidgetTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/embed_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed': tester.tests_passed,
                'failed': tester.tests_run - tester.tests_passed,
                'success_rate': f"{(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%",
                'issues_found': len(tester.issues)
            },
            'issues': tester.issues,
            'detailed_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())