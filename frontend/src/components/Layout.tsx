import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/companies", label: "Компании" },
  { to: "/filials", label: "Филиалы" },
  { to: "/sources", label: "Источники" },
  { to: "/credentials", label: "Маркетплейсы" },
  { to: "/reviews", label: "Отзывы" },
];

export default function Layout() {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">{user?.full_name ?? "Reviews"}</div>
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
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
