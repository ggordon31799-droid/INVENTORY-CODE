import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import PurchaseOrders from "./pages/PurchaseOrders";
import Orders from "./pages/Orders";
import InventoryActions from "./pages/InventoryActions";

const navItems = [
  { path: "/", label: "Dashboard" },
  { path: "/products", label: "Products" },
  { path: "/purchase-orders", label: "Purchase Orders" },
  { path: "/orders", label: "Orders" },
  { path: "/inventory-actions", label: "Inventory Actions" },
];

export default function App() {
  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-gray-900 text-white flex-shrink-0">
        <div className="p-4 text-lg font-bold border-b border-gray-700">
          Inventory
        </div>
        <nav className="flex flex-col p-2 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm ${
                  isActive
                    ? "bg-gray-700 text-white font-medium"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/inventory-actions" element={<InventoryActions />} />
        </Routes>
      </main>
    </div>
  );
}
