import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/companies", label: "Компании" },
  { to: "/filials", label: "Филиалы" },
  { to: "/sources", label: "Источники" },
  { to: "/credentials", label: "Маркетплейсы" },
  { to: "/reviews", label: "Отзывы" },
  { to: "/telegram", label: "Telegram" },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Reviews Admin</div>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {user && (
            <div className="user-info">
              <div className="user-name">{user.full_name}</div>
              <div className="user-email">{user.email}</div>
            </div>
          )}
          <button className="btn btn-secondary" onClick={logout}>
            Выйти
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
