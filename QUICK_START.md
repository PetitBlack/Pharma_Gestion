# Quick Start Guide - Pharmacy Management System

## Getting Started

### 1. Login
When you first open the application, you'll see the login screen.

**Demo Credentials:**
- **Admin:** username: `admin`, password: `admin123`
- **Employee:** username: `employee`, password: `emp123`

### 2. Navigation
After login, you'll see the main interface with:
- **Left Sidebar:** Navigate between different sections
- **Top Header:** Shows current user, role, and date

## Main Sections

### 📊 Dashboard
Your central hub for monitoring pharmacy operations.
- **Today's Sales:** Total revenue for the current day
- **Total Medicines:** Number of products in inventory
- **Low Stock Alerts:** Items requiring restocking
- **Expiring Soon:** Products expiring within 90 days
- **Sales Chart:** 7-day sales trend visualization
- **Quick Alerts Panel:** Top 5 low stock and expiring items

### 💊 Medicines Management
Complete medicine inventory control.

**Features:**
- View all medicines in a sortable table
- Search by name, category, or batch number
- Add new medicines with full details
- Edit existing medicine information
- Delete medicines (with confirmation)
- Status indicators: OK (green), Low (orange), Expiring (yellow)

**To Add a Medicine:**
1. Click "Add Medicine" button
2. Fill in required fields (name, category)
3. Add optional details (batch, expiry, quantity, price)
4. Click "Add Medicine"

### 🛒 Sales (Point of Sale)
Fast and efficient sales processing.

**Workflow:**
1. **Search Medicine:** Type medicine name in search box
2. **Select Medicine:** Click on the medicine from search results
3. **Set Quantity:** Enter desired quantity
4. **Add to Cart:** Click "Add to Cart"
5. **Repeat:** Add more items as needed
6. **Choose Payment:** Select Cash or Mobile Money
7. **Complete Sale:** Click "Complete Sale"

**Features:**
- Real-time stock validation
- Cart management with item removal
- Automatic inventory updates
- Running total calculation
- Toast notifications for success/errors

### ⚠️ Stock Alerts
Monitor critical inventory issues.

**Two Alert Types:**

**Low Stock (Orange):**
- Shows medicines below threshold (default: 20 units)
- Displays current quantity
- Helps prevent stockouts

**Expiring Soon (Red):**
- Shows medicines expiring within 90 days
- Displays expiration date and days remaining
- Color-coded urgency (red < 30 days, yellow > 30 days)

### 👥 Users Management
Control system access and permissions.

**User Roles:**
- **Admin:** Full system access, can manage users
- **Employee:** Limited access, cannot manage users

**Admin Functions:**
- Add new users
- Assign roles
- Delete users (except yourself)
- View all user details

### ⚙️ Settings
Configure system parameters.

**Pharmacy Information:**
- Name, license, address, phone, email

**Stock Alerts Configuration:**
- Low Stock Threshold (default: 20)
- Expiry Alert Period (default: 90 days)

**Backup Settings:**
- Enable/disable automatic backups
- Set backup frequency (Daily, Weekly, Monthly)

## Tips & Best Practices

### For Admins
1. **Regular Stock Checks:** Review Stock Alerts daily
2. **User Management:** Only give Admin role to trusted staff
3. **Update Settings:** Adjust alert thresholds based on your pharmacy size
4. **Monitor Dashboard:** Check sales trends and inventory levels

### For Employees
1. **Accurate Sales:** Double-check quantities before completing sales
2. **Stock Awareness:** Be aware of low stock items
3. **Fast Checkout:** Use search efficiently for quick sales
4. **Report Issues:** Inform admins about discrepancies

## Keyboard Shortcuts (Future Enhancement)
- `Ctrl+F` - Focus search (Medicines)
- `Ctrl+N` - New medicine/sale
- `Esc` - Close dialogs

## Common Workflows

### Daily Opening Routine
1. Login to system
2. Check Dashboard for overnight alerts
3. Review Stock Alerts
4. Process pending orders

### Processing a Sale
1. Navigate to Sales
2. Search and add medicines to cart
3. Verify total
4. Select payment method
5. Complete sale
6. Provide receipt (future feature)

### Monthly Inventory Review
1. Go to Medicines
2. Check for expiring items
3. Review low stock items
4. Update quantities as needed
5. Remove expired medicines

## Data Persistence

**Current Implementation:**
- Data stored in browser memory and localStorage
- User sessions persist across page refreshes
- Data resets on application restart

**For Production:**
- Integrate with SQLite or PostgreSQL
- Implement proper data backup
- Enable offline-first capabilities

## Support & Troubleshooting

### Can't Login?
- Verify credentials (case-sensitive)
- Clear browser cache and try again
- Check console for errors

### Sale Failed?
- Verify sufficient stock
- Check medicine is not expired
- Ensure quantities are valid

### Missing Features?
This is a demonstration version. Full production version would include:
- Barcode scanning
- Receipt printing
- Advanced reporting
- Supplier management
- Purchase orders
- Prescription tracking

## Security Notes

⚠️ **Important:** This demo stores passwords in plain text for demonstration purposes only.

**In Production:**
- Use proper password hashing (bcrypt)
- Implement secure authentication
- Add audit logging
- Use HTTPS/TLS
- Regular security updates

## Next Steps

1. Explore all sections
2. Try creating test sales
3. Add sample medicines
4. Configure settings to your needs
5. Consider database integration for production use

---

**Need Help?** This is a local desktop application designed for pharmacy operations. For production deployment, consult with IT professionals for proper database setup, security, and compliance with local regulations.
