import requests
import sys
import json
from datetime import datetime, date, timedelta

class BookingWidgetAPITester:
    def __init__(self, base_url="https://reserve-js.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.business_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, method, endpoint, expected_status, actual_status, success, response_data=None, error=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ PASS: {name} - {method} {endpoint} - {actual_status}")
        else:
            print(f"❌ FAIL: {name} - {method} {endpoint}")
            print(f"   Expected: {expected_status}, Got: {actual_status}")
            if error:
                print(f"   Error: {error}")
        
        self.test_results.append({
            "name": name,
            "method": method,
            "endpoint": endpoint,
            "expected_status": expected_status,
            "actual_status": actual_status,
            "success": success,
            "response_data": response_data,
            "error": str(error) if error else None
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        if self.token and 'Authorization' not in headers:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            response_data = None
            try:
                response_data = response.json()
            except:
                response_data = response.text

            self.log_test(name, method, endpoint, expected_status, response.status_code, success, response_data)
            return success, response_data, response.status_code

        except Exception as e:
            self.log_test(name, method, endpoint, expected_status, 0, False, None, e)
            return False, {}, 0

    def test_register_business(self):
        """Test business registration"""
        test_email = f"test_business_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response_data, status = self.run_test(
            "Register New Business",
            "POST",
            "admin/register",
            200,
            {
                "business_name": "Test Business",
                "description": "A test business for API testing",
                "email": test_email,
                "password": "test123"
            }
        )
        
        if success and 'token' in response_data:
            # Store for later tests
            self.test_token = response_data['token']
            self.test_business_id = response_data['business_id']
            return True
        return False

    def test_register_demo_business(self):
        """Test demo business registration/login"""
        # Try to register demo business (might already exist)
        success, response_data, status = self.run_test(
            "Register/Login Demo Business",
            "POST", 
            "admin/register",
            [200, 400],  # 200 if new, 400 if exists
            {
                "business_name": "Demo Salon",
                "description": "A demo booking experience", 
                "email": "demo@bookingwidget.com",
                "password": "demo123"
            }
        )

        if status == 200 and 'token' in response_data:
            self.token = response_data['token']
            self.business_id = response_data['business_id']
            return True
        elif status == 400:
            # Business exists, try login
            return self.test_login_demo()
        return False

    def test_login_demo(self):
        """Test demo business login"""
        success, response_data, status = self.run_test(
            "Login Demo Business",
            "POST",
            "admin/login", 
            200,
            {
                "email": "demo@bookingwidget.com",
                "password": "demo123"
            }
        )

        if success and 'token' in response_data:
            self.token = response_data['token'] 
            self.business_id = response_data['business_id']
            return True
        return False

    def test_get_business_public(self):
        """Test getting business public info"""
        if not self.business_id:
            print("⚠️  Skipping business public test - no business_id available")
            return False
            
        success, response_data, status = self.run_test(
            "Get Business Public Info",
            "GET",
            f"businesses/{self.business_id}",
            200
        )
        return success

    def test_add_service(self):
        """Test adding a service"""
        if not self.token:
            print("⚠️  Skipping add service test - no token available")
            return False
            
        success, response_data, status = self.run_test(
            "Add Service",
            "POST", 
            "admin/services",
            200,
            {
                "name": "Test Haircut",
                "duration": 30,
                "description": "A test haircut service",
                "price": 25.00
            }
        )
        
        if success and 'id' in response_data:
            self.service_id = response_data['id']
            return True
        return False

    def test_get_admin_business(self):
        """Test getting admin business info"""
        if not self.token:
            print("⚠️  Skipping admin business test - no token available")
            return False
            
        success, response_data, status = self.run_test(
            "Get Admin Business Info",
            "GET",
            "admin/business",
            200
        )
        return success

    def test_get_admin_bookings(self):
        """Test getting admin bookings"""
        if not self.token:
            print("⚠️  Skipping admin bookings test - no token available")
            return False
            
        success, response_data, status = self.run_test(
            "Get Admin Bookings", 
            "GET",
            "admin/bookings",
            200
        )
        return success

    def test_get_slots(self):
        """Test getting available slots"""
        if not self.business_id or not hasattr(self, 'service_id'):
            print("⚠️  Skipping slots test - missing business_id or service_id")
            return False
            
        tomorrow = (date.today() + timedelta(days=1)).strftime('%Y-%m-%d')
        success, response_data, status = self.run_test(
            "Get Available Slots",
            "GET", 
            f"businesses/{self.business_id}/slots",
            200,
            params={
                "date": tomorrow,
                "service_id": self.service_id
            }
        )
        return success

    def test_create_booking(self):
        """Test creating a booking"""
        if not self.business_id or not hasattr(self, 'service_id'):
            print("⚠️  Skipping booking test - missing business_id or service_id")
            return False
            
        tomorrow = (date.today() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        success, response_data, status = self.run_test(
            "Create Booking",
            "POST",
            "bookings", 
            200,
            {
                "business_id": self.business_id,
                "service_id": self.service_id,
                "date": tomorrow,
                "start_time": "10:00",
                "customer_name": "Test Customer",
                "customer_email": "test@example.com", 
                "customer_phone": "+1234567890"
            }
        )
        
        if success and 'id' in response_data:
            self.booking_id = response_data['id']
            return True
        return False

    def test_update_availability(self):
        """Test updating business availability"""
        if not self.token:
            print("⚠️  Skipping availability test - no token available")
            return False
            
        # Set Monday-Friday 9-17, weekend closed
        availability = []
        for day in range(7):
            availability.append({
                "day": day,
                "start_time": "09:00" if day < 5 else "10:00",
                "end_time": "17:00" if day < 5 else "16:00", 
                "enabled": day < 5  # Mon-Fri enabled
            })
        
        success, response_data, status = self.run_test(
            "Update Availability",
            "PUT",
            "admin/availability",
            200,
            {"availability": availability}
        )
        return success

    def test_block_date(self):
        """Test blocking a date"""
        if not self.token:
            print("⚠️  Skipping block date test - no token available")  
            return False
            
        block_date = (date.today() + timedelta(days=7)).strftime('%Y-%m-%d')
        
        success, response_data, status = self.run_test(
            "Block Date",
            "POST", 
            "admin/blocked-dates",
            200,
            {"date": block_date}
        )
        
        if success:
            self.blocked_date = block_date
            return True
        return False

    def test_unblock_date(self):
        """Test unblocking a date"""
        if not self.token or not hasattr(self, 'blocked_date'):
            print("⚠️  Skipping unblock date test - no token or blocked date available")
            return False
            
        success, response_data, status = self.run_test(
            "Unblock Date",
            "DELETE",
            f"admin/blocked-dates/{self.blocked_date}",
            200
        )
        return success

    def test_delete_service(self):
        """Test deleting a service"""
        if not self.token or not hasattr(self, 'service_id'):
            print("⚠️  Skipping delete service test - no token or service_id available")
            return False
            
        success, response_data, status = self.run_test(
            "Delete Service",
            "DELETE",
            f"admin/services/{self.service_id}",
            200
        )
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print(f"🔍 Testing Booking Widget API at: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        test_sequence = [
            ("Demo Business Setup", self.test_register_demo_business),
            ("Get Business Public Info", self.test_get_business_public),
            ("Get Admin Business Info", self.test_get_admin_business), 
            ("Add Service", self.test_add_service),
            ("Get Admin Bookings", self.test_get_admin_bookings),
            ("Update Availability", self.test_update_availability),
            ("Get Available Slots", self.test_get_slots),
            ("Create Booking", self.test_create_booking),
            ("Block Date", self.test_block_date),
            ("Unblock Date", self.test_unblock_date),
            ("Register New Business", self.test_register_business),
            ("Delete Service", self.test_delete_service),
        ]
        
        for test_name, test_func in test_sequence:
            print(f"\n🧪 Running: {test_name}")
            try:
                test_func()
            except Exception as e:
                print(f"❌ Error in {test_name}: {str(e)}")

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed < self.tests_run:
            print("\n❌ Failed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['name']}: {result['error'] or 'Status mismatch'}")
                    
        return self.tests_passed == self.tests_run

def main():
    tester = BookingWidgetAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed': tester.tests_passed,
                'failed': tester.tests_run - tester.tests_passed,
                'success_rate': f"{(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%"
            },
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())