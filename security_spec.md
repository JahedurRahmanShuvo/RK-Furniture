# Firestore Security Specification - TDD Spec

## Data Invariants
1. **Products Catalog Integrity**: Only authenticated store administrators can write, modify, or delete product entries. The public has read-only access.
2. **Categories & Structure**: Only administrators are permitted to create, update, or delete categories. The public has read-only access.
3. **Carousel Slides & Banners**: Slides can only be mutated by verified administrators.
4. **Orders Integrity**: Anyone can place/create an order (anonymous checkout/guest or logged-in accounts), but once created, only administrators or the customer with matching mobile credentials can view or update. The status field (e.g. `'Pending'`, `'Processing'`, `'Delivered'`) is a terminal/state-controlled transition.
5. **Coupons Validity**: Discounters can only be modified by administrators. The public has read-only access to check and validate active voucher codes.
6. **Support contact & Shop policies**: Help desk entries can only be updated by the store administrators.
7. **Store Sessions & Heartbeats**: Any visiting browser (represented by custom `sessionId`) can write or update its heartbeat, but updates can only change `lastSeen` values to prevent session hijacking.
8. **User Registry Security**: Registration data matches the system users. Private credentials must be guarded against public queries.

---

## The "Dirty Dozen" Payloads

Here are twelve payloads designed to violate Identity, Integrity, or State transitions, which our security rules must reject:

### 1. Shadow Field Injection in Products
```json
{
  "id": "new_sofa",
  "name": "Luxury Sofa",
  "price": 250,
  "image": "/images/sofa.jpg",
  "category": "living_room",
  "ghost_field_hack": "attacker_injected_field"
}
```
*Expected: REJECTED (Exact keys enforcement checks size == 5).*

### 2. Privilege Escalation to Admin role on User Profile Sign-up
```json
{
  "name": "Attacker",
  "email": "attacker@hack.com",
  "role": "admin"
}
```
*Expected: REJECTED (User Profiles cannot contain unrequested RBAC claims, only Name and Email allowed).*

### 3. Price Poisoning (Negative Price Check)
```json
{
  "id": "sofa_10",
  "name": "Luxury Sofa",
  "price": -100,
  "image": "/images/sofa.jpg",
  "category": "living_room"
}
```
*Expected: REJECTED (Price must be a positive number).*

### 4. Injecting 1MB String as Document ID (Denial of Wallet)
```json
{
  "id": "huge_string_here_spanning_1_million_characters..."
}
```
*Expected: REJECTED (isValidId size check limit <= 128).*

### 5. Anonymous Modification of Carousel slides
```json
{
  "id": "slide_new",
  "title": "Malicious Promo",
  "bg": "/hacked.png"
}
```
*Expected: REJECTED (Write rules require admin role).*

### 6. Anonymous Customer Overwriting Another Customer's Order Status
```json
{
  "status": "Delivered"
}
```
*Expected: REJECTED (Only admins can modify critical status fields of existing orders).*

### 7. Empty Field Validation Bypass on Category Addition
```json
{
  "id": "cat_empty",
  "name": ""
}
```
*Expected: REJECTED (Lengths must be strictly non-empty).*

### 8. Hijacking Another User's Active Heartbeat Session
```json
{
  "sessionId": "victim_session_123",
  "deviceName": "Victim Laptop",
  "isAdmin": true,
  "lastSeen": 1780590000
}
```
*Expected: REJECTED (Only current sessionId matching resource owner or admins can modify a heartbeat).*

### 9. Mutating Historic Transformed Timestamp Fields
```json
{
  "id": "order_123",
  "total": 300,
  "createdAt": "2026-01-01T00:00:00Z"
}
```
*Expected: REJECTED (CreatedAt must match request.time or be immutable list after creation).*

### 10. Blank Coupon Discount Percent Overflow (150% Off Hack)
```json
{
  "id": "coupon_hack",
  "code": "FREEALL",
  "discountPercent": 150,
  "isActive": true
}
```
*Expected: REJECTED (discountPercent must be >= 0 and <= 100).*

### 11. Spoofing Admin Identity via Email Verification Bypass
```json
{
  "uid": "fake_admin_uid",
  "email": "admin@rkfurniture.com"
}
```
*Expected: REJECTED (Admin status checks request.auth.token.email_verified).*

### 12. Public Extraction of PII Fields (Query Scraping)
```sql
SELECT * FROM /users/
```
*Expected: REJECTED (Allow list checked securely to enforce matching uid or phone number filters).*

---

## Complete Mock Test Runner (firestore.rules.test.ts)

Below is the type definitions and structure for the test runner:

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

describe('Firestore Security Rules Test Suite', () => {
  let testEnv: any;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'rk-furniture-e0b7e',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it('prohibits anonymous product insertions', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthedDb.collection('products').add({ name: 'Malicious Chair' }));
  });

  it('prohibits shadow field injection in products', async () => {
    const adminDb = testEnv.authenticatedContext('admin_uid', { email: 'admin@rkfurniture.com', email_verified: true }).firestore();
    await assertFails(adminDb.collection('products').doc('sofa_1').set({
      id: 'sofa_1',
      name: 'Super Premium Couch',
      price: 250,
      image: '/couch.png',
      category: 'sofas',
      ghost_field: 'illegal'
    }));
  });
});
```
