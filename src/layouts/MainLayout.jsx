import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { adminRoutes } from "../routes/AppRoutes";

import {
  FiGrid,
  FiUsers,
  FiMessageSquare,
  FiLogOut,
  FiCalendar,
  FiCheckSquare,
  FiSearch,
  FiMenu,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 72;
const TOPBAR_HEIGHT = 72;

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  const menuItems = [
    {
      name: "Dashboard",
      path: `${adminRoutes}/dashboard`,
      icon: FiGrid,
    },
    {
      name: "Tasks",
      path: `${adminRoutes}/tasks`,
      icon: FiCheckSquare,
    },
    {
      name: "Attendance",
      path: `${adminRoutes}/attendance`,
      icon: FiCalendar,
    },
    {
      name: "Employees",
      path: `${adminRoutes}/employees`,
      icon: FiUsers,
    },
    {
      name: "Group Chat",
      path: `${adminRoutes}/chat`,
      icon: FiMessageSquare,
    },
  ];

  const activePage =
    menuItems.find((item) => location.pathname === item.path)?.name ||
    "Dashboard";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate(`${adminRoutes}/`);
  };

  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() || "A";

  return (
    <div className="h-screen overflow-hidden bg-[#0b1220] text-white">
      {/* SIDEBAR — fixed left */}
      <aside
        className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.06] bg-slate-950/75 shadow-[4px_0_24px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-[width] duration-300 ease-out"
        style={{ width: sidebarWidth }}
      >
        {/* Brand */}
        <div
          className={`flex shrink-0 items-center border-b border-white/[0.06] ${
            collapsed ? "justify-center px-3 py-3.5" : "gap-3 px-5 py-3.5"
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold shadow-lg shadow-blue-500/25">
            WA
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-white">
                Work Admin
              </h1>
              <p className="truncate text-xs text-slate-400">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav
          className={`flex-1 overflow-y-auto overflow-x-hidden py-4 ${
            collapsed ? "px-2" : "px-3"
          }`}
        >
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    title={collapsed ? item.name : undefined}
                    className={`
                      group relative flex items-center rounded-xl transition-all duration-200
                      ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"}
                      ${
                        active
                          ? "bg-blue-500/15 text-blue-300 shadow-inner shadow-blue-500/5"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 hover:translate-x-0.5"
                      }
                    `}
                  >
                    {active && (
                      <span
                        className={`absolute top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-500 ${
                          collapsed ? "left-0" : "left-0"
                        }`}
                      />
                    )}
                    <span
                      className={`flex shrink-0 items-center justify-center text-lg transition-transform duration-200 group-hover:scale-110 ${
                        active ? "text-blue-400" : ""
                      }`}
                    >
                      <Icon />
                    </span>
                    {!collapsed && (
                      <span
                        className={`truncate text-sm font-medium ${
                          active ? "text-blue-100" : ""
                        }`}
                      >
                        {item.name}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse + Logout */}
        <div
          className={`shrink-0 space-y-2 border-t border-white/[0.06] ${
            collapsed ? "p-2" : "p-3"
          }`}
        >
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex w-full items-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-slate-400 transition-all duration-200 hover:bg-white/[0.06] hover:text-white ${
              collapsed
                ? "justify-center p-3"
                : "gap-3 px-3 py-2.5"
            }`}
          >
            {collapsed ? (
              <FiChevronRight className="text-lg" />
            ) : (
              <>
                <FiChevronLeft className="text-lg shrink-0" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className={`flex w-full items-center rounded-xl bg-red-500/10 text-red-300 transition-all duration-200 hover:bg-red-500/20 hover:text-red-200 ${
              collapsed
                ? "justify-center p-3"
                : "justify-center gap-2 px-3 py-2.5"
            }`}
          >
            <FiLogOut className="text-lg shrink-0" />
            {!collapsed && (
              <span className="text-sm font-semibold">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* TOPBAR — fixed top, offset by sidebar */}
      <header
        className="fixed top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-white/[0.06] bg-slate-950/80 px-4 shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-md sm:px-6 transition-[left] duration-300 ease-out"
        style={{
          left: sidebarWidth,
          right: 0,
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
            aria-label="Toggle sidebar"
          >
            <FiMenu className="text-lg" />
          </button>

          <div className="min-w-0">
            {/* <p className="truncate text-xs font-medium uppercase tracking-wider text-slate-500">
              Work Admin
            </p> */}
            <h1 className="truncate text-lg font-bold text-white sm:text-xl">
              {activePage}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* <div className="relative hidden sm:block">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="h-10 w-44 rounded-xl border border-white/[0.06] bg-white/[0.04] pl-10 pr-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-blue-500/40 focus:bg-white/[0.06] focus:ring-1 focus:ring-blue-500/30 md:w-56 lg:w-64"
            />
          </div> */}

          <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] py-1.5 pl-1.5 pr-3 sm:pr-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold shadow-md shadow-blue-500/20">
              {userInitial}
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name || "Admin"}
              </p>
              <p className="truncate text-xs capitalize text-slate-400">
                {user?.role?.replaceAll("_", " ") || "User"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN — offset for sidebar + topbar; only inner scrolls */}
      <main
        className="h-screen overflow-hidden transition-[margin-left] duration-300 ease-out"
        style={{
          marginLeft: sidebarWidth,
          paddingTop: TOPBAR_HEIGHT,
        }}
      >
        <div className="h-[calc(100vh-72px)] overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
