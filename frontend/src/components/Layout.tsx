import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Главная", icon: "🏠" },
  { to: "/reviews", label: "Отзывы", icon: "💬" },
  { to: "/filials", label: "Филиалы", icon: "📍" },
  { to: "/credentials", label: "Маркетплейсы", icon: "🛍" },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <main className="content">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => "bottom-nav-item" + (isActive ? " active" : "")}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
