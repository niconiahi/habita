import {
  index,
  route,
  type RouteConfig,
} from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  //  GET    /properties          -> properties#index
  //  GET    /properties/new      -> properties#new
  //  POST   /properties          -> properties#create
  //  GET    /properties/:id      -> properties#show
  //  GET    /properties/:id/edit -> properties#edit
  //  PATCH  /properties/:id      -> properties#update
  //  PUT    /properties/:id      -> properties#update
  //  DELETE /properties/:id      -> properties#destroy
  route("properties", "routes/properties/layout.tsx", [
    index("routes/properties/_index.tsx"),
    route("new", "routes/properties/new.tsx"),
    route(":id/contracts/new", "routes/contracts/new.tsx"),
    route(":id/edit", "routes/properties/:id.edit.tsx"),
    route(":id", "routes/properties/:id.tsx"),
  ]),
  route("contracts/pdf", "routes/contracts/pdf.tsx"),
  route("files/:id", "routes/files/:id.ts"),
] satisfies RouteConfig
