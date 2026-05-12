export const resolveDashboardPath = (role) => {
    if (role === "teacher") return "/teachacc";
    if (role === "admin") return "/admin";
    return "/dashboard";
};

export const studentRoles = ["student", "mooc", "mock_user"];

const authExperiencePaths = new Set([
    "/sign_in",
    "/sign_up",
    "/verify-otp",
    "/teacher",
    "/teacher_in",
    "/admin_login",
    "/admin_signup"
]);

export const isAuthExperiencePath = (pathname = "") => authExperiencePaths.has(pathname);
