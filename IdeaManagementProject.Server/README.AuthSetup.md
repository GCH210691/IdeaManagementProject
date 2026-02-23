# University Idea Management Auth Backend Setup

## 1) Prerequisites
- MySQL running locally
- Update `appsettings.Development.json` with your local MySQL credentials

## 2) Create migration
From repository root:

```powershell
dotnet ef migrations add InitialAuthRbac --project IdeaManagementProject.Server --startup-project IdeaManagementProject.Server
```

## 3) Apply migration

```powershell
dotnet ef database update --project IdeaManagementProject.Server --startup-project IdeaManagementProject.Server
```

## 4) Run API

```powershell
dotnet run --project IdeaManagementProject.Server
```

On startup, runtime seeding creates:
- Roles: `STAFF`, `QA_COORDINATOR`, `QA_MANAGER`, `ADMIN`
- Departments: `Administration`, `Computer Science`
- Admin user:
  - email: `admin@university.com`
  - password: `Admin@123`

## 5) Test in Swagger
- Open `/swagger`
- Call `POST /api/auth/login` with admin credentials
- Copy `token`
- Click **Authorize** and paste: `Bearer <token>`
- Test:
  - `GET /api/auth/me`
  - `GET /api/admin/ping`
  - `GET /api/manager/ping`
  - `GET /api/staff/ping`
