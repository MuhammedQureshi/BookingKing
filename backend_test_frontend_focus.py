import requests
import sys
from datetime import datetime

class FrontendFocusAPITester:
    def __init__(self, base_url="https://reserve-js.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return True, response.json() if response.content else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.content:
                    print(f"Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_demo_login(self):
        """Test demo login"""
        success, response = self.run_test(
            "Demo Admin Login",
            "POST",
            "admin/login",
            200,
            data={"email": "demo@bookingwidget.com", "password": "demo123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            return True, response.get('business_id')
        return False, None

    def test_business_fetch(self, business_id):
        """Test fetching business data"""
        success, response = self.run_test(
            "Fetch Business Data",
            "GET",
            f"businesses/{business_id}",
            200
        )
        return success, response

def main():
    print("🔍 Frontend-focused API Testing for Booking Widget")
    print("=" * 50)
    
    tester = FrontendFocusAPITester()
    
    # Test 1: Demo Login
    login_success, business_id = tester.test_demo_login()
    if not login_success:
        print("❌ Cannot proceed - demo login failed")
        return 1
    
    print(f"✅ Demo login successful - Business ID: {business_id}")
    
    # Test 2: Business data fetch (critical for widget)
    business_success, business_data = tester.test_business_fetch(business_id)
    if business_success:
        print(f"✅ Business data loaded - Services: {len(business_data.get('services', []))}")
    
    # Test 3: Check if demo business has services
    if business_data and business_data.get('services'):
        print(f"✅ Demo business has {len(business_data['services'])} services configured")
        for service in business_data['services']:
            print(f"  - {service.get('name')} (${service.get('price')}, {service.get('duration')} min)")
    
    # Test 4: Test slot availability (critical for booking)
    if business_id:
        success, slots = tester.run_test(
            "Check Available Slots",
            "GET", 
            f"businesses/{business_id}/slots?date=2026-02-15&service_id=1",
            200
        )
        if success:
            print(f"✅ Slots endpoint working - slots returned: {len(slots)}")
    
    # Print results
    print(f"\n📊 API Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    # Frontend connectivity test
    print(f"\n🌐 Frontend URL Test:")
    try:
        response = requests.get(tester.base_url, timeout=10)
        if response.status_code == 200:
            print(f"✅ Frontend loads successfully ({response.status_code})")
        else:
            print(f"⚠️ Frontend returned {response.status_code}")
    except Exception as e:
        print(f"❌ Frontend connection error: {str(e)}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())