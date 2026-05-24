# Beta Metrics Tracker

Use this document to track weekly database growth, user engagement metrics, and hosting costs. Leave cells blank or populate them during the weekly review cycle.

---

## 📈 Weekly Telemetry Log

| Sprint Period | Total Registrations | Active Resumes | Total Saved Jobs | Total Tracked Applications | Mock Subscriptions Active | Average AI Parse Time | Daily Active Users (DAU) | Monthly API Costs ($) |
|---|---|---|---|---|---|---|---|---|
| **Week 1** | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* |
| **Week 2** | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* |
| **Week 3** | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* |
| **Week 4** | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* | *[Pending]* |

---

## 💡 Database Analytics Queries
Run these queries in MongoDB Compass or Atlas Shell to retrieve the data:

```javascript
// 1. Total registrations
db.users.countDocuments({});

// 2. Active Resumes
db.resumes.countDocuments({});

// 3. Tracked Applications
db.applications.countDocuments({});

// 4. Average Applications per User
db.applications.aggregate([
  { $group: { _id: "$userId", count: { $sum: 1 } } },
  { $group: { _id: null, avgApplications: { $avg: "$count" } } }
]);
```
