# CrewAI Agent Authentication Guide

## Overview

This guide provides complete authentication implementation details for integrating CrewAI agents with the ASP Cranes CRM API. The CRM uses JWT (JSON Web Token) authentication, and this document shows exactly how to implement it in your CrewAI agents.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication Architecture](#authentication-architecture)
3. [Implementation Patterns](#implementation-patterns)
4. [Complete Code Examples](#complete-code-examples)
5. [API Endpoint Reference](#api-endpoint-reference)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- CrewAI agent/tool setup
- Valid user credentials for the CRM
- Network access to the CRM API (http://103.224.243.242:3001)

### Minimal Example

```python
import requests

# Step 1: Authenticate and get token
response = requests.post(
    "http://103.224.243.242:3001/api/auth/login",
    json={
        "email": "your-bot@aspcranes.com",
        "password": "your-secure-password"
    }
)

auth_data = response.json()
token = auth_data["token"]

# Step 2: Use token for API calls
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Example: Get quotations
quotations = requests.get(
    "http://103.224.243.242:3001/api/quotations",
    headers=headers
).json()
```

---

## Authentication Architecture

### JWT Token Flow

```
┌─────────────┐                  ┌──────────────┐
│  CrewAI     │                  │   CRM API    │
│  Agent      │                  │   Server     │
└──────┬──────┘                  └──────┬───────┘
       │                                │
       │  POST /api/auth/login         │
       │  { email, password }           │
       ├───────────────────────────────>│
       │                                │
       │  200 OK                        │
       │  { token, user }               │
       │<───────────────────────────────┤
       │                                │
       │  GET /api/quotations           │
       │  Authorization: Bearer <token> │
       ├───────────────────────────────>│
       │                                │
       │  200 OK                        │
       │  [ quotations... ]             │
       │<───────────────────────────────┤
       │                                │
```

### Authentication Components

1. **JWT Secret**: `MoBly0rPrUSgf8yj0yuzTQgceJJy/FwCaYY62qGA7zm3vFugjPh46YR5uHsvfCP1+gKiOqjISkmrzWfRgIdv0Q==`
2. **Token Expiry**: 24 hours from issuance
3. **Auth Header**: `Authorization: Bearer <token>`
4. **Token Payload**: Contains `{ id, email, role, name }`

---

## Implementation Patterns

### Pattern 1: Session-Based Authentication (Recommended)

This pattern authenticates once and reuses the token across multiple operations.

```python
class CRMSession:
    def __init__(self, base_url: str, email: str, password: str):
        self.base_url = base_url.rstrip('/')
        self.email = email
        self.password = password
        self.token = None
        self.user = None
        
    def authenticate(self):
        """Authenticate and store token"""
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"email": self.email, "password": self.password}
        )
        response.raise_for_status()
        
        data = response.json()
        self.token = data["token"]
        self.user = data["user"]
        print(f"✅ Authenticated as: {self.user['name']} ({self.user['role']})")
        
    def get_headers(self):
        """Get authenticated headers"""
        if not self.token:
            raise Exception("Not authenticated. Call authenticate() first.")
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def request(self, method: str, endpoint: str, **kwargs):
        """Make authenticated API request"""
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        kwargs['headers'] = self.get_headers()
        
        response = requests.request(method, url, **kwargs)
        
        # Auto-reauthenticate on 403
        if response.status_code == 403:
            print("⚠️  Token expired, re-authenticating...")
            self.authenticate()
            kwargs['headers'] = self.get_headers()
            response = requests.request(method, url, **kwargs)
        
        response.raise_for_status()
        return response.json() if response.content else None

# Usage
session = CRMSession(
    base_url="http://103.224.243.242:3001",
    email="bot@aspcranes.com",
    password="secure-password"
)
session.authenticate()

# Now make calls
quotations = session.request("GET", "/quotations")
leads = session.request("GET", "/leads")
```

### Pattern 2: Per-Request Authentication (Simple but Inefficient)

```python
def authenticate_and_call(endpoint: str, method: str = "GET", **kwargs):
    """Authenticate and make a single call"""
    # Login
    auth_response = requests.post(
        "http://103.224.243.242:3001/api/auth/login",
        json={
            "email": "bot@aspcranes.com",
            "password": "secure-password"
        }
    )
    token = auth_response.json()["token"]
    
    # Make call
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.request(
        method,
        f"http://103.224.243.242:3001/api/{endpoint}",
        headers=headers,
        **kwargs
    )
    
    return response.json()

# Usage
quotations = authenticate_and_call("/quotations")
```

---

## Complete Code Examples

### Example 1: CrewAI Tool with CRM Integration

```python
from crewai import Tool
from typing import Optional
import requests
import os

class CRMAuthenticatedTool(Tool):
    """CrewAI tool with built-in CRM authentication"""
    
    def __init__(self):
        super().__init__(
            name="crm_query",
            description="Query the ASP Cranes CRM for customer, lead, quotation, or equipment data"
        )
        
        self.base_url = os.getenv("CRM_API_URL", "http://103.224.243.242:3001")
        self.email = os.getenv("CRM_BOT_EMAIL")
        self.password = os.getenv("CRM_BOT_PASSWORD")
        self.token = None
        
        if not self.email or not self.password:
            raise ValueError("CRM_BOT_EMAIL and CRM_BOT_PASSWORD must be set")
        
        # Authenticate on initialization
        self._authenticate()
    
    def _authenticate(self):
        """Get JWT token"""
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={"email": self.email, "password": self.password},
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            self.token = data["token"]
            print(f"✅ CRM Tool authenticated as: {data['user']['name']}")
            
        except Exception as e:
            print(f"❌ CRM authentication failed: {e}")
            raise
    
    def _get_headers(self):
        """Get authenticated headers"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def _make_request(self, method: str, endpoint: str, **kwargs):
        """Make authenticated request with auto-retry"""
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        kwargs['headers'] = self._get_headers()
        kwargs['timeout'] = kwargs.get('timeout', 30)
        
        response = requests.request(method, url, **kwargs)
        
        # Re-authenticate on token expiry
        if response.status_code == 403:
            print("⚠️  Token expired, re-authenticating...")
            self._authenticate()
            kwargs['headers'] = self._get_headers()
            response = requests.request(method, url, **kwargs)
        
        response.raise_for_status()
        return response.json() if response.content else None
    
    def _run(self, query: str) -> str:
        """Execute the tool"""
        try:
            # Parse query and route to appropriate endpoint
            query_lower = query.lower()
            
            if "quotation" in query_lower:
                data = self._make_request("GET", "/quotations")
                return f"Found {len(data)} quotations: {data}"
            
            elif "lead" in query_lower:
                data = self._make_request("GET", "/leads")
                return f"Found {len(data)} leads: {data}"
            
            elif "customer" in query_lower:
                data = self._make_request("GET", "/customers")
                return f"Found {len(data)} customers: {data}"
            
            elif "equipment" in query_lower:
                data = self._make_request("GET", "/equipment")
                return f"Found {len(data)} equipment items: {data}"
            
            else:
                return "Please specify: quotation, lead, customer, or equipment"
                
        except Exception as e:
            return f"Error querying CRM: {str(e)}"

# Usage in CrewAI
crm_tool = CRMAuthenticatedTool()

agent = Agent(
    role="Sales Assistant",
    goal="Help manage CRM data",
    tools=[crm_tool],
    verbose=True
)
```

### Example 2: Standalone CRM Client for CrewAI Agents

```python
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta

class ASPCranesCRMClient:
    """
    Production-ready CRM client for CrewAI agents
    Handles authentication, token refresh, and all CRM operations
    """
    
    def __init__(
        self,
        base_url: str = "http://103.224.243.242:3001",
        email: str = None,
        password: str = None
    ):
        self.base_url = base_url.rstrip('/')
        self.email = email
        self.password = password
        self.token: Optional[str] = None
        self.token_expires_at: Optional[datetime] = None
        self.user_info: Optional[Dict] = None
    
    def authenticate(self) -> bool:
        """
        Authenticate with the CRM and get JWT token
        Returns: True if successful, False otherwise
        """
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={
                    "email": self.email,
                    "password": self.password
                },
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            self.token = data["token"]
            self.user_info = data["user"]
            
            # Tokens expire in 24 hours
            self.token_expires_at = datetime.now() + timedelta(hours=23, minutes=50)
            
            print(f"✅ Authenticated as: {self.user_info['name']} ({self.user_info['role']})")
            return True
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Authentication failed: {e}")
            return False
    
    def _ensure_authenticated(self):
        """Ensure we have a valid token"""
        if not self.token:
            if not self.authenticate():
                raise Exception("Failed to authenticate with CRM")
        
        # Refresh if token is about to expire
        if self.token_expires_at and datetime.now() >= self.token_expires_at:
            print("⚠️  Token expired, re-authenticating...")
            if not self.authenticate():
                raise Exception("Failed to re-authenticate with CRM")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers with authentication"""
        self._ensure_authenticated()
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def _request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> Any:
        """
        Make authenticated API request
        Handles token refresh and error handling
        """
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        kwargs['headers'] = self._get_headers()
        kwargs['timeout'] = kwargs.get('timeout', 30)
        
        try:
            response = requests.request(method, url, **kwargs)
            
            # Handle token expiry
            if response.status_code == 403:
                print("⚠️  Token rejected, re-authenticating...")
                self.token = None
                self._ensure_authenticated()
                kwargs['headers'] = self._get_headers()
                response = requests.request(method, url, **kwargs)
            
            response.raise_for_status()
            return response.json() if response.content else None
            
        except requests.exceptions.RequestException as e:
            print(f"❌ API request failed: {e}")
            raise
    
    # ==================== QUOTATION METHODS ====================
    
    def get_quotations(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Get all quotations with optional filters"""
        params = filters or {}
        return self._request("GET", "/quotations", params=params)
    
    def get_quotation(self, quotation_id: str) -> Dict:
        """Get single quotation by ID"""
        return self._request("GET", f"/quotations/{quotation_id}")
    
    def create_quotation(self, quotation_data: Dict) -> Dict:
        """Create new quotation"""
        return self._request("POST", "/quotations", json=quotation_data)
    
    def update_quotation(self, quotation_id: str, updates: Dict) -> Dict:
        """Update existing quotation"""
        return self._request("PUT", f"/quotations/{quotation_id}", json=updates)
    
    # ==================== LEAD METHODS ====================
    
    def get_leads(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Get all leads"""
        params = filters or {}
        return self._request("GET", "/leads", params=params)
    
    def create_lead(self, lead_data: Dict) -> Dict:
        """Create new lead"""
        return self._request("POST", "/leads", json=lead_data)
    
    def update_lead(self, lead_id: str, updates: Dict) -> Dict:
        """Update lead"""
        return self._request("PUT", f"/leads/{lead_id}", json=updates)
    
    # ==================== CUSTOMER METHODS ====================
    
    def get_customers(self) -> List[Dict]:
        """Get all customers"""
        return self._request("GET", "/customers")
    
    def get_customer(self, customer_id: str) -> Dict:
        """Get single customer"""
        return self._request("GET", f"/customers/{customer_id}")
    
    def create_customer(self, customer_data: Dict) -> Dict:
        """Create new customer"""
        return self._request("POST", "/customers", json=customer_data)
    
    # ==================== EQUIPMENT METHODS ====================
    
    def get_equipment(self) -> List[Dict]:
        """Get all equipment"""
        return self._request("GET", "/equipment")
    
    def get_equipment_item(self, equipment_id: str) -> Dict:
        """Get single equipment item"""
        return self._request("GET", f"/equipment/{equipment_id}")
    
    # ==================== DEAL METHODS ====================
    
    def get_deals(self) -> List[Dict]:
        """Get all deals"""
        return self._request("GET", "/deals")
    
    def create_deal(self, deal_data: Dict) -> Dict:
        """Create new deal"""
        return self._request("POST", "/deals", json=deal_data)
    
    # ==================== AI INTEGRATION METHODS ====================
    
    def process_with_ai(self, query: str, context: Optional[Dict] = None) -> Dict:
        """Process query through CRM's AI system"""
        return self._request(
            "POST",
            "/ai/chat",
            json={
                "query": query,
                "context": context or {}
            }
        )
    
    def analyze_lead_with_ai(self, lead_data: Dict) -> Dict:
        """Analyze lead using AI"""
        return self._request("POST", "/ai/leads/process", json=lead_data)
    
    def generate_quotation_with_ai(self, quotation_data: Dict) -> Dict:
        """Generate quotation using AI"""
        return self._request("POST", "/ai/quotations/generate", json=quotation_data)


# ==================== USAGE EXAMPLES ====================

if __name__ == "__main__":
    # Initialize client
    crm = ASPCranesCRMClient(
        base_url="http://103.224.243.242:3001",
        email="bot@aspcranes.com",
        password="secure-password-123"
    )
    
    # Authenticate
    if crm.authenticate():
        
        # Example 1: Get all quotations
        quotations = crm.get_quotations()
        print(f"\n📋 Found {len(quotations)} quotations")
        
        # Example 2: Create a lead
        new_lead = crm.create_lead({
            "customerName": "ABC Construction",
            "contactPerson": "John Doe",
            "email": "john@abc.com",
            "phone": "+1234567890",
            "requirements": "50-ton crane for 2 weeks"
        })
        print(f"\n✅ Created lead: {new_lead['id']}")
        
        # Example 3: Use AI to analyze lead
        ai_analysis = crm.analyze_lead_with_ai(new_lead)
        print(f"\n🤖 AI Analysis: {ai_analysis}")
        
        # Example 4: Get customers
        customers = crm.get_customers()
        print(f"\n👥 Found {len(customers)} customers")
```

---

## API Endpoint Reference

### Authentication Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/login` | POST | No | Login and get JWT token |
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/validate` | GET | Yes | Validate current token |
| `/api/auth/verify-token` | POST | No | Verify token validity |
| `/api/auth/profile` | GET | Yes | Get user profile |
| `/api/auth/sales-agents` | GET | No* | Get sales agents list |

*Dev bypass available

### Core CRM Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/quotations` | GET | Yes | List all quotations |
| `/api/quotations/:id` | GET | Yes | Get quotation details |
| `/api/quotations` | POST | Yes | Create quotation |
| `/api/quotations/:id` | PUT | Yes | Update quotation |
| `/api/leads` | GET | Yes | List all leads |
| `/api/leads` | POST | Yes | Create lead |
| `/api/customers` | GET | Yes | List all customers |
| `/api/customers/:id` | GET | Yes | Get customer details |
| `/api/equipment` | GET | Yes | List all equipment |
| `/api/deals` | GET | **No** | List all deals (bypass enabled) |
| `/api/dashboard/analytics` | GET | Yes | Get dashboard analytics |

### AI Integration Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/ai/chat` | POST | Yes | Chat with AI system |
| `/api/ai/leads/process` | POST | Yes | AI lead processing |
| `/api/ai/quotations/generate` | POST | Yes | AI quotation generation |
| `/api/crewai-cloud/chat` | POST | No | Direct CrewAI chat |
| `/api/crewai-cloud/leads/process` | POST | No | CrewAI lead processing |
| `/api/crewai-cloud/quotations/generate` | POST | No | CrewAI quotation generation |

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Action Required |
|------|---------|-----------------|
| 200 | Success | Parse response data |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Check request payload |
| 401 | Unauthorized | No token provided or invalid credentials |
| 403 | Forbidden | Token expired or invalid - re-authenticate |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Retry or contact support |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description",
  "timestamp": "2025-11-05T10:30:00Z"
}
```

### Handling Authentication Errors

```python
def safe_api_call(crm_client, method, *args, **kwargs):
    """
    Wrapper for safe API calls with error handling
    """
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            return getattr(crm_client, method)(*args, **kwargs)
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                print("❌ Authentication required - check credentials")
                raise
            
            elif e.response.status_code == 403:
                print("⚠️  Token expired, retrying...")
                crm_client.authenticate()
                retry_count += 1
                
            elif e.response.status_code >= 500:
                print(f"⚠️  Server error, retry {retry_count + 1}/{max_retries}")
                retry_count += 1
                time.sleep(2 ** retry_count)  # Exponential backoff
                
            else:
                raise
                
        except requests.exceptions.ConnectionError:
            print(f"⚠️  Connection error, retry {retry_count + 1}/{max_retries}")
            retry_count += 1
            time.sleep(2 ** retry_count)
    
    raise Exception(f"Failed after {max_retries} retries")

# Usage
try:
    quotations = safe_api_call(crm, 'get_quotations')
except Exception as e:
    print(f"Failed to get quotations: {e}")
```

---

## Best Practices

### 1. Environment Variables

Store credentials in environment variables, never hardcode:

```python
import os

CRM_API_URL = os.getenv("CRM_API_URL", "http://103.224.243.242:3001")
CRM_BOT_EMAIL = os.getenv("CRM_BOT_EMAIL")
CRM_BOT_PASSWORD = os.getenv("CRM_BOT_PASSWORD")

if not CRM_BOT_EMAIL or not CRM_BOT_PASSWORD:
    raise ValueError("CRM credentials not set in environment")
```

### 2. Token Caching

Reuse tokens across requests to avoid unnecessary authentication:

```python
# Good: Authenticate once, reuse token
session = CRMSession(...)
session.authenticate()
for i in range(100):
    data = session.request("GET", "/quotations")

# Bad: Authenticate every request
for i in range(100):
    token = login()  # Wastes time and resources
    data = get_with_token(token)
```

### 3. Graceful Degradation

Handle API failures gracefully in CrewAI agents:

```python
def get_crm_data_safe(crm_client, resource: str):
    """Safe CRM data fetch with fallback"""
    try:
        return crm_client._request("GET", f"/{resource}")
    except Exception as e:
        print(f"⚠️  CRM fetch failed: {e}")
        return []  # Return empty instead of crashing
```

### 4. Logging

Log authentication events for debugging:

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def authenticate(self):
    logger.info(f"Authenticating as {self.email}")
    # ... authentication logic
    logger.info(f"✅ Authenticated successfully. Token expires at {self.token_expires_at}")
```

### 5. Connection Pooling

Use session objects for connection reuse:

```python
import requests

class CRMClient:
    def __init__(self):
        self.session = requests.Session()  # Reuses connections
        
    def _request(self, method, url, **kwargs):
        return self.session.request(method, url, **kwargs)
```

---

## Troubleshooting

### Problem: "401 Unauthorized"

**Cause**: No token or invalid credentials

**Solution**:
```python
# 1. Verify credentials
response = requests.post(
    "http://103.224.243.242:3001/api/auth/login",
    json={"email": "your-email", "password": "your-password"}
)
print(response.status_code)  # Should be 200
print(response.json())        # Should contain 'token' key

# 2. Check environment variables
print(f"Email: {os.getenv('CRM_BOT_EMAIL')}")
print(f"Password set: {bool(os.getenv('CRM_BOT_PASSWORD'))}")
```

### Problem: "403 Forbidden"

**Cause**: Token expired or invalid

**Solution**:
```python
# Re-authenticate to get fresh token
crm.token = None
crm.authenticate()
```

### Problem: "Connection refused" or "Connection timeout"

**Cause**: Network issue or wrong URL

**Solution**:
```python
# Test connectivity
import requests

try:
    response = requests.get(
        "http://103.224.243.242:3001/api/health",
        timeout=5
    )
    print(f"✅ API reachable: {response.status_code}")
except Exception as e:
    print(f"❌ Cannot reach API: {e}")
```

### Problem: Dev bypass header not working

**Cause**: Bypass only works on localhost in development mode

**Solution**:
Use proper JWT authentication instead. The bypass header (`x-bypass-auth: development-only-123`) only works when:
1. Request comes from `localhost` or `127.0.0.1`
2. `NODE_ENV !== 'production'`

For remote access (like from CrewAI cloud), always use JWT tokens.

---

## Production Deployment Checklist

- [ ] Create dedicated bot user account in CRM
- [ ] Store credentials in secure environment variables
- [ ] Implement token refresh logic
- [ ] Add error handling and retries
- [ ] Enable request logging
- [ ] Test token expiry handling
- [ ] Implement rate limiting awareness
- [ ] Add connection timeout handling
- [ ] Test network failure scenarios
- [ ] Document API usage patterns

---

## Example: Full CrewAI Agent Integration

```python
# crm_agent.py
import os
from crewai import Agent, Task, Crew
from crewai_tools import tool
import requests

# Initialize CRM client (from examples above)
from crm_client import ASPCranesCRMClient

crm = ASPCranesCRMClient(
    base_url=os.getenv("CRM_API_URL"),
    email=os.getenv("CRM_BOT_EMAIL"),
    password=os.getenv("CRM_BOT_PASSWORD")
)

# Authenticate on startup
crm.authenticate()

@tool("Get CRM Quotations")
def get_quotations_tool(filters: str = "") -> str:
    """Fetch quotations from the CRM system"""
    try:
        quotations = crm.get_quotations()
        return f"Found {len(quotations)} quotations: {quotations}"
    except Exception as e:
        return f"Error fetching quotations: {str(e)}"

@tool("Create CRM Lead")
def create_lead_tool(customer_name: str, email: str, requirements: str) -> str:
    """Create a new lead in the CRM"""
    try:
        lead = crm.create_lead({
            "customerName": customer_name,
            "email": email,
            "requirements": requirements
        })
        return f"✅ Created lead: {lead['id']}"
    except Exception as e:
        return f"Error creating lead: {str(e)}"

# Define agent
sales_agent = Agent(
    role="Sales Manager",
    goal="Manage quotations and leads in ASP Cranes CRM",
    backstory="Expert at CRM operations and customer relationship management",
    tools=[get_quotations_tool, create_lead_tool],
    verbose=True
)

# Define task
task = Task(
    description="Get all quotations and create a summary report",
    agent=sales_agent,
    expected_output="A summary of all quotations in the system"
)

# Create crew and run
crew = Crew(
    agents=[sales_agent],
    tasks=[task],
    verbose=True
)

result = crew.kickoff()
print(result)
```

---

## Support & Resources

- **API Base URL**: http://103.224.243.242:3001
- **API Documentation**: See `README.md` section 2 (Repository Structure)
- **Token Expiry**: 24 hours
- **Rate Limits**: 100 requests per 15 minutes (per IP)

For questions or issues, review the authentication middleware code in:
- `crm-app/backend/src/middleware/authMiddleware.mjs`
- `crm-app/backend/src/routes/authRoutes.mjs`

---

**Last Updated**: November 5, 2025
