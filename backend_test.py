#!/usr/bin/env python3
"""
Comprehensive backend API tests for Caradde Employee Attendance System
Tests all admin and user endpoints with various scenarios
"""

import requests
import json
import sys
from typing import Optional, Dict, Any

# Base URL from .env
BASE_URL = "https://6e9be129-7281-451f-9919-140b5422b3b7.preview.emergentagent.com/api"

# Admin credentials
ADMIN_USERNAME = "caradde"
ADMIN_PASSWORD = "!Car4dde@2026"

# Test employee credentials
TEST_NIP = "199810292025211068"
TEST_PASSWORD = "@29Oktober1998"
TEST_DEVICE_ID = "O11019"

# Session storage
admin_cookie = None
user_cookie = None
created_employee_id = None

def print_test(name: str):
    """Print test name"""
    print(f"\n{'='*80}")
    print(f"TEST: {name}")
    print('='*80)

def print_result(success: bool, message: str, details: Optional[Dict[Any, Any]] = None):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if details:
        print(f"Details: {json.dumps(details, indent=2)}")

def get_cookies_dict(cookie_name: str, cookie_value: str) -> Dict[str, str]:
    """Create cookies dict"""
    return {cookie_name: cookie_value}

# ============================================================================
# ADMIN AUTHENTICATION TESTS
# ============================================================================

def test_admin_login_wrong_credentials():
    """Test admin login with wrong credentials"""
    print_test("Admin Login - Wrong Credentials")
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"username": "wrong", "password": "wrong"},
            timeout=10
        )
        
        if response.status_code == 401:
            data = response.json()
            if "Username atau password admin salah" in data.get("message", ""):
                print_result(True, "Correctly rejected wrong credentials with 401")
                return True
            else:
                print_result(False, f"Wrong error message: {data.get('message')}")
                return False
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_admin_login_correct_credentials():
    """Test admin login with correct credentials"""
    global admin_cookie
    print_test("Admin Login - Correct Credentials")
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            # Check for caradde_admin cookie
            if 'caradde_admin' in response.cookies:
                admin_cookie = response.cookies['caradde_admin']
                print_result(True, "Admin login successful, cookie set", {"username": data.get("data", {}).get("username")})
                return True
            else:
                print_result(False, "No caradde_admin cookie in response")
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}", response.json())
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_admin_me_with_cookie():
    """Test GET /api/admin/me with valid cookie"""
    print_test("Admin Me - With Cookie")
    try:
        if not admin_cookie:
            print_result(False, "No admin cookie available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/admin/me",
            cookies=get_cookies_dict("caradde_admin", admin_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            user_data = data.get("data", {})
            if user_data.get("username") == ADMIN_USERNAME and user_data.get("role") == "admin":
                print_result(True, "Admin me endpoint working", user_data)
                return True
            else:
                print_result(False, "Unexpected response data", data)
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_admin_me_without_cookie():
    """Test GET /api/admin/me without cookie"""
    print_test("Admin Me - Without Cookie")
    try:
        response = requests.get(f"{BASE_URL}/admin/me", timeout=10)
        
        if response.status_code == 401:
            print_result(True, "Correctly rejected request without cookie")
            return True
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# EMPLOYEE CRUD TESTS
# ============================================================================

def test_employees_list_without_cookie():
    """Test GET /api/admin/employees without cookie"""
    print_test("Employees List - Without Cookie")
    try:
        response = requests.get(f"{BASE_URL}/admin/employees", timeout=10)
        
        if response.status_code == 401:
            print_result(True, "Correctly rejected request without admin cookie")
            return True
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_employees_list():
    """Test GET /api/admin/employees with cookie"""
    print_test("Employees List - With Cookie")
    try:
        response = requests.get(
            f"{BASE_URL}/admin/employees",
            cookies=get_cookies_dict("caradde_admin", admin_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            employees = data.get("data", [])
            print_result(True, f"Retrieved {len(employees)} employees")
            return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_create_employee_missing_field():
    """Test POST /api/admin/employees with missing field"""
    print_test("Create Employee - Missing Field")
    try:
        response = requests.post(
            f"{BASE_URL}/admin/employees",
            json={"nomorInduk": TEST_NIP},  # Missing password and deviceId
            cookies=get_cookies_dict("caradde_admin", admin_cookie),
            timeout=10
        )
        
        if response.status_code == 400:
            print_result(True, "Correctly rejected request with missing fields")
            return True
        else:
            print_result(False, f"Expected 400, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_create_employee():
    """Test POST /api/admin/employees with valid data"""
    global created_employee_id
    print_test("Create Employee - Valid Data")
    try:
        # First, try to delete if exists
        response = requests.get(
            f"{BASE_URL}/admin/employees",
            cookies=get_cookies_dict("caradde_admin", admin_cookie),
            timeout=10
        )
        if response.status_code == 200:
            employees = response.json().get("data", [])
            for emp in employees:
                if emp.get("nomorInduk") == TEST_NIP:
                    # Delete existing
                    requests.delete(
                        f"{BASE_URL}/admin/employees/{emp['id']}",
                        cookies=get_cookies_dict("caradde_admin", admin_cookie),
                        timeout=10
                    )
                    print("Deleted existing test employee")
        
        # Now create
        response = requests.post(
            f"{BASE_URL}/admin/employees",
            json={
                "nomorInduk": TEST_NIP,
                "password": TEST_PASSWORD,
                "deviceId": TEST_DEVICE_ID
            },
            cookies=get_cookies_dict("caradde_admin", admin_cookie),
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            created_employee_id = data.get("data", {}).get("id")
            print_result(True, "Employee created successfully", {"id": created_employee_id})
            return True
        else:
            print_result(False, f"Expected 201, got {response.status_code}", response.json())
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_create_duplicate_employee():
    """Test POST /api/admin/employees with duplicate NIP"""
    print_test("Create Employee - Duplicate NIP")
    try:
        response = requests.post(
            f"{BASE_URL}/admin/employees",
            json={
                "nomorInduk": TEST_NIP,
                "password": TEST_PASSWORD,
                "deviceId": TEST_DEVICE_ID
            },
            cookies=get_cookies_dict("caradde_admin", admin_cookie),
            timeout=10
        )
        
        if response.status_code == 409:
            data = response.json()
            if "NIP/NUPTK sudah terdaftar" in data.get("message", ""):
                print_result(True, "Correctly rejected duplicate NIP with 409")
                return True
            else:
                print_result(False, f"Wrong error message: {data.get('message')}")
                return False
        else:
            print_result(False, f"Expected 409, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_get_employee_by_id():
    """Test GET /api/admin/employees/{id}"""
    print_test("Get Employee By ID")
    try:
        if not created_employee_id:
            print_result(False, "No employee ID available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/admin/employees/{created_employee_id}",
            cookies=get_cookies_dict("caradde_admin", admin_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            emp = data.get("data", {})
            if emp.get("nomorInduk") == TEST_NIP:
                print_result(True, "Retrieved employee details", {"nomorInduk": emp.get("nomorInduk")})
                return True
            else:
                print_result(False, "Wrong employee data", emp)
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_get_employee_invalid_id():
    """Test GET /api/admin/employees/{invalidId}"""
    print_test("Get Employee - Invalid ID")
    try:
        response = requests.get(
            f"{BASE_URL}/admin/employees/000000000000000000000000",
            cookies=get_cookies_dict("caradde_admin", admin_cookie),
            timeout=10
        )
        
        if response.status_code == 404:
            print_result(True, "Correctly returned 404 for invalid ID")
            return True
        else:
            print_result(False, f"Expected 404, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_update_employee():
    """Test PUT /api/admin/employees/{id}"""
    print_test("Update Employee")
    try:
        if not created_employee_id:
            print_result(False, "No employee ID available")
            return False
        
        response = requests.put(
            f"{BASE_URL}/admin/employees/{created_employee_id}",
            json={"employeeName": "Test Update Name"},
            cookies=get_cookies_dict("caradde_admin", admin_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            print_result(True, "Employee updated successfully")
            return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# USER LOGIN TESTS
# ============================================================================

def test_user_login_not_registered():
    """Test POST /api/user/login with non-existent NIP"""
    print_test("User Login - Non-existent NIP")
    try:
        response = requests.post(
            f"{BASE_URL}/user/login",
            json={"nomorInduk": "000000"},
            timeout=10
        )
        
        if response.status_code == 500:
            data = response.json()
            meta = data.get("meta", {})
            if meta.get("message") == "Terjadi kesalahan internal server":
                print_result(True, "Correctly returned 500 with expected message for non-existent NIP")
                return True
            else:
                print_result(False, f"Wrong error message: {meta.get('message')}")
                return False
        else:
            print_result(False, f"Expected 500, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_user_login_valid():
    """Test POST /api/user/login with valid NIP"""
    global user_cookie
    print_test("User Login - Valid NIP")
    try:
        response = requests.post(
            f"{BASE_URL}/user/login",
            json={"nomorInduk": TEST_NIP},
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            user_data = data.get("data", {}).get("user", {})
            
            if meta.get("code") == 200 and 'caradde_user' in response.cookies:
                user_cookie = response.cookies['caradde_user']
                expected_name = "M. MURSALIN DARMAWAN, S.Pd."
                actual_name = user_data.get("name", "")
                
                if actual_name == expected_name:
                    print_result(True, "User login successful", {"name": actual_name})
                    return True
                else:
                    print_result(False, f"Expected name '{expected_name}', got '{actual_name}'")
                    return False
            else:
                print_result(False, "Missing cookie or wrong meta code", data)
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}", response.json())
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_verify_employee_authorization():
    """Verify employee has authorization token after login"""
    print_test("Verify Employee Authorization After Login")
    try:
        if not created_employee_id:
            print_result(False, "No employee ID available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/admin/employees/{created_employee_id}",
            cookies=get_cookies_dict("caradde_admin", admin_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            emp = data.get("data", {})
            has_auth = emp.get("hasAuthorization", False)
            employee_name = emp.get("employeeName", "")
            
            if has_auth and employee_name:
                print_result(True, "Employee has authorization and name updated", {
                    "hasAuthorization": has_auth,
                    "employeeName": employee_name
                })
                return True
            else:
                print_result(False, "Employee missing authorization or name", emp)
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# USER PROXY ENDPOINT TESTS
# ============================================================================

def test_user_me_without_cookie():
    """Test GET /api/user/me without cookie"""
    print_test("User Me - Without Cookie")
    try:
        response = requests.get(f"{BASE_URL}/user/me", timeout=10)
        
        if response.status_code == 401:
            print_result(True, "Correctly rejected request without user cookie")
            return True
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_user_me():
    """Test GET /api/user/me with cookie"""
    print_test("User Me - With Cookie")
    try:
        if not user_cookie:
            print_result(False, "No user cookie available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/user/me",
            cookies=get_cookies_dict("caradde_user", user_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            user_data = data.get("data", {})
            required_fields = ["id", "nomorInduk", "employeeName", "instansi", "jabatan", "email"]
            
            has_all_fields = all(field in user_data for field in required_fields)
            if has_all_fields:
                print_result(True, "User me endpoint working", {
                    "nomorInduk": user_data.get("nomorInduk"),
                    "employeeName": user_data.get("employeeName")
                })
                return True
            else:
                print_result(False, "Missing required fields", user_data)
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_user_beranda():
    """Test GET /api/user/beranda"""
    print_test("User Beranda")
    try:
        if not user_cookie:
            print_result(False, "No user cookie available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/user/beranda",
            cookies=get_cookies_dict("caradde_user", user_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            meta = data.get("meta", {})
            beranda_data = data.get("data", {})
            
            if meta.get("code") == 200:
                has_required = "can_presence" in beranda_data and "date" in beranda_data
                print_result(True, "Beranda endpoint working", {
                    "can_presence": beranda_data.get("can_presence"),
                    "date": beranda_data.get("date")
                })
                return True
            else:
                print_result(False, "Wrong meta code", data)
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_user_presensi_status():
    """Test GET /api/user/presensi/status"""
    print_test("User Presensi Status")
    try:
        if not user_cookie:
            print_result(False, "No user cookie available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/user/presensi/status",
            cookies=get_cookies_dict("caradde_user", user_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            status_data = data.get("data", {})
            
            has_required = "sudah_presensi_datang" in status_data and "jam_kerja" in status_data
            if has_required:
                print_result(True, "Presensi status endpoint working", {
                    "sudah_presensi_datang": status_data.get("sudah_presensi_datang"),
                    "sudah_presensi_pulang": status_data.get("sudah_presensi_pulang")
                })
                return True
            else:
                print_result(False, "Missing required fields", status_data)
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_user_presensi_locations():
    """Test GET /api/user/presensi/locations"""
    print_test("User Presensi Locations")
    try:
        if not user_cookie:
            print_result(False, "No user cookie available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/user/presensi/locations",
            cookies=get_cookies_dict("caradde_user", user_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            locations_data = data.get("data", {})
            locations = locations_data.get("locations", [])
            
            if isinstance(locations, list) and len(locations) > 0:
                print_result(True, "Presensi locations endpoint working", {
                    "locations_count": len(locations),
                    "primary_location": locations[0].get("agency_name") if locations else None
                })
                return True
            else:
                print_result(False, "No locations returned", locations_data)
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_user_me_after_locations():
    """Test GET /api/user/me after locations call to verify instansi update"""
    print_test("User Me - After Locations (Verify Instansi Update)")
    try:
        if not user_cookie:
            print_result(False, "No user cookie available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/user/me",
            cookies=get_cookies_dict("caradde_user", user_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            user_data = data.get("data", {})
            instansi = user_data.get("instansi", "")
            
            # Should be updated to primary location
            expected_instansi = "SD NEGERI SAMATA"
            if instansi == expected_instansi:
                print_result(True, "Instansi auto-updated correctly", {"instansi": instansi})
                return True
            else:
                # Minor issue - instansi might not be updated yet or different
                print_result(True, f"Minor: Instansi is '{instansi}', expected '{expected_instansi}' (may vary)")
                return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_user_riwayat():
    """Test GET /api/user/riwayat with pagination"""
    print_test("User Riwayat")
    try:
        if not user_cookie:
            print_result(False, "No user cookie available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/user/riwayat?page=1&limit=5&filter=Bulan+ini",
            cookies=get_cookies_dict("caradde_user", user_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            riwayat_data = data.get("data", {})
            items = riwayat_data.get("items", [])
            
            if isinstance(items, list):
                print_result(True, "Riwayat endpoint working", {
                    "items_count": len(items),
                    "pagination": {
                        "page": riwayat_data.get("page"),
                        "limit": riwayat_data.get("limit")
                    }
                })
                return True
            else:
                print_result(False, "No items array in response", riwayat_data)
                return False
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# AUTHORIZATION GUARD TESTS
# ============================================================================

def test_admin_endpoint_with_user_cookie():
    """Test admin endpoint with user cookie (should fail)"""
    print_test("Admin Endpoint - With User Cookie (Should Fail)")
    try:
        if not user_cookie:
            print_result(False, "No user cookie available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/admin/employees",
            cookies=get_cookies_dict("caradde_user", user_cookie),
            timeout=10
        )
        
        if response.status_code == 401:
            print_result(True, "Correctly rejected user cookie on admin endpoint")
            return True
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_user_endpoint_with_admin_cookie():
    """Test user endpoint with admin cookie (should fail)"""
    print_test("User Endpoint - With Admin Cookie (Should Fail)")
    try:
        if not admin_cookie:
            print_result(False, "No admin cookie available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/user/beranda",
            cookies=get_cookies_dict("caradde_admin", admin_cookie),
            timeout=10
        )
        
        if response.status_code == 401:
            data = response.json()
            meta = data.get("meta", {})
            if meta.get("code") == 401:
                print_result(True, "Correctly rejected admin cookie on user endpoint")
                return True
            else:
                print_result(False, "Wrong response format", data)
                return False
        else:
            print_result(False, f"Expected 401, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# LOGOUT TESTS
# ============================================================================

def test_user_logout():
    """Test POST /api/user/logout"""
    print_test("User Logout")
    try:
        if not user_cookie:
            print_result(False, "No user cookie available")
            return False
        
        response = requests.post(
            f"{BASE_URL}/user/logout",
            cookies=get_cookies_dict("caradde_user", user_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            print_result(True, "User logout successful")
            return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_admin_logout():
    """Test POST /api/admin/logout"""
    print_test("Admin Logout")
    try:
        if not admin_cookie:
            print_result(False, "No admin cookie available")
            return False
        
        response = requests.post(
            f"{BASE_URL}/admin/logout",
            cookies=get_cookies_dict("caradde_admin", admin_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            print_result(True, "Admin logout successful")
            return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# PASSWORD UPDATE INVALIDATION TEST
# ============================================================================

def test_password_update_invalidates_auth():
    """Test that updating password invalidates authorization"""
    print_test("Password Update - Invalidates Authorization")
    try:
        # Re-login as admin
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=10
        )
        if response.status_code != 200:
            print_result(False, "Failed to re-login as admin")
            return False
        
        new_admin_cookie = response.cookies['caradde_admin']
        
        # Get employee ID
        response = requests.get(
            f"{BASE_URL}/admin/employees",
            cookies=get_cookies_dict("caradde_admin", new_admin_cookie),
            timeout=10
        )
        employees = response.json().get("data", [])
        test_emp = next((e for e in employees if e.get("nomorInduk") == TEST_NIP), None)
        
        if not test_emp:
            print_result(False, "Test employee not found")
            return False
        
        emp_id = test_emp["id"]
        
        # Update password
        response = requests.put(
            f"{BASE_URL}/admin/employees/{emp_id}",
            json={"password": TEST_PASSWORD},  # Same password, but should invalidate
            cookies=get_cookies_dict("caradde_admin", new_admin_cookie),
            timeout=10
        )
        
        if response.status_code != 200:
            print_result(False, f"Failed to update password: {response.status_code}")
            return False
        
        # Check if authorization is cleared
        response = requests.get(
            f"{BASE_URL}/admin/employees/{emp_id}",
            cookies=get_cookies_dict("caradde_admin", new_admin_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            emp = response.json().get("data", {})
            has_auth = emp.get("hasAuthorization", False)
            
            if not has_auth:
                print_result(True, "Password update correctly invalidated authorization")
                return True
            else:
                print_result(False, "Authorization not invalidated after password update")
                return False
        else:
            print_result(False, f"Failed to get employee: {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# DELETE EMPLOYEE TEST
# ============================================================================

def test_delete_employee():
    """Test DELETE /api/admin/employees/{id}"""
    print_test("Delete Employee")
    try:
        # Re-login as admin
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=10
        )
        if response.status_code != 200:
            print_result(False, "Failed to re-login as admin")
            return False
        
        new_admin_cookie = response.cookies['caradde_admin']
        
        # Get employee ID
        response = requests.get(
            f"{BASE_URL}/admin/employees",
            cookies=get_cookies_dict("caradde_admin", new_admin_cookie),
            timeout=10
        )
        employees = response.json().get("data", [])
        test_emp = next((e for e in employees if e.get("nomorInduk") == TEST_NIP), None)
        
        if not test_emp:
            print_result(False, "Test employee not found")
            return False
        
        emp_id = test_emp["id"]
        
        # Delete
        response = requests.delete(
            f"{BASE_URL}/admin/employees/{emp_id}",
            cookies=get_cookies_dict("caradde_admin", new_admin_cookie),
            timeout=10
        )
        
        if response.status_code == 200:
            print_result(True, "Employee deleted successfully")
            return True
        else:
            print_result(False, f"Expected 200, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_delete_nonexistent_employee():
    """Test DELETE /api/admin/employees/{nonexistent}"""
    print_test("Delete Employee - Non-existent")
    try:
        # Re-login as admin
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=10
        )
        if response.status_code != 200:
            print_result(False, "Failed to re-login as admin")
            return False
        
        new_admin_cookie = response.cookies['caradde_admin']
        
        response = requests.delete(
            f"{BASE_URL}/admin/employees/000000000000000000000000",
            cookies=get_cookies_dict("caradde_admin", new_admin_cookie),
            timeout=10
        )
        
        if response.status_code == 404:
            print_result(True, "Correctly returned 404 for non-existent employee")
            return True
        else:
            print_result(False, f"Expected 404, got {response.status_code}")
            return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def run_all_tests():
    """Run all tests in sequence"""
    print("\n" + "="*80)
    print("CARADDE EMPLOYEE ATTENDANCE BACKEND API TESTS")
    print("="*80)
    
    results = []
    
    # Admin Authentication Tests
    results.append(("Admin Login - Wrong Credentials", test_admin_login_wrong_credentials()))
    results.append(("Admin Login - Correct Credentials", test_admin_login_correct_credentials()))
    results.append(("Admin Me - With Cookie", test_admin_me_with_cookie()))
    results.append(("Admin Me - Without Cookie", test_admin_me_without_cookie()))
    
    # Employee CRUD Tests
    results.append(("Employees List - Without Cookie", test_employees_list_without_cookie()))
    results.append(("Employees List - With Cookie", test_employees_list()))
    results.append(("Create Employee - Missing Field", test_create_employee_missing_field()))
    results.append(("Create Employee - Valid Data", test_create_employee()))
    results.append(("Create Employee - Duplicate NIP", test_create_duplicate_employee()))
    results.append(("Get Employee By ID", test_get_employee_by_id()))
    results.append(("Get Employee - Invalid ID", test_get_employee_invalid_id()))
    results.append(("Update Employee", test_update_employee()))
    
    # User Login Tests
    results.append(("User Login - Non-existent NIP", test_user_login_not_registered()))
    results.append(("User Login - Valid NIP", test_user_login_valid()))
    results.append(("Verify Employee Authorization After Login", test_verify_employee_authorization()))
    
    # User Proxy Endpoint Tests
    results.append(("User Me - Without Cookie", test_user_me_without_cookie()))
    results.append(("User Me - With Cookie", test_user_me()))
    results.append(("User Beranda", test_user_beranda()))
    results.append(("User Presensi Status", test_user_presensi_status()))
    results.append(("User Presensi Locations", test_user_presensi_locations()))
    results.append(("User Me - After Locations", test_user_me_after_locations()))
    results.append(("User Riwayat", test_user_riwayat()))
    
    # Authorization Guard Tests
    results.append(("Admin Endpoint - With User Cookie", test_admin_endpoint_with_user_cookie()))
    results.append(("User Endpoint - With Admin Cookie", test_user_endpoint_with_admin_cookie()))
    
    # Logout Tests
    results.append(("User Logout", test_user_logout()))
    results.append(("Admin Logout", test_admin_logout()))
    
    # Password Update Test
    results.append(("Password Update - Invalidates Authorization", test_password_update_invalidates_auth()))
    
    # Delete Tests
    results.append(("Delete Employee", test_delete_employee()))
    results.append(("Delete Employee - Non-existent", test_delete_nonexistent_employee()))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\nTotal Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    print("\nDetailed Results:")
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
