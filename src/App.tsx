import { Navigate, Route, Routes } from "react-router-dom";

import { APP_ROUTES } from "@/config/app.routes";
import LoginPage from "@/modules/auth/pages/login";
import { ProtectedRoute } from "@/modules/auth/components/protected-route";
import PanelLayout from "@/modules/panel/components/panel-layout";
import PanelHomePage from "@/modules/panel/pages/panel-home.page";
import ProductsPage from "@/modules/products/pages/products.page";
import CategoriesPage from "@/modules/product-categories/pages/categories.page";
import TapPage from "@/modules/tap/pages/tap.page";

export default function App() {
  return (
    <Routes>
      <Route path={APP_ROUTES.tap.root} element={<TapPage />} />
      <Route path={`${APP_ROUTES.auth.login}/*`} element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path={APP_ROUTES.panel.root} element={<PanelLayout />}>
          <Route index element={<PanelHomePage />} />
          <Route path={APP_ROUTES.panel.products} element={<ProductsPage />} />
          <Route path={APP_ROUTES.panel.categories} element={<CategoriesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={APP_ROUTES.panel.root} replace />} />
    </Routes>
  );
}
