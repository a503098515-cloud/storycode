### Proposed API Endpoints

| Route | Method | Input Schema | Error Shape | Scope |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/resources` | `GET` | **Query:**<br>`page?: number`<br>`limit?: number` | `StandardError`<br>*(400, 401)* | `resources:read` |
| `/api/v1/resources` | `POST` | **Body:**<br>`name: string`<br>`status: "active" \| "draft"` | `ValidationError`<br>`StandardError`<br>*(400, 401, 409)* | `resources:write` |
| `/api/v1/resources/:id` | `GET` | **Params:**<br>`id: string (uuid)` | `StandardError`<br>*(401, 404)* | `resources:read` |
| `/api/v1/resources/:id` | `PATCH` | **Params:**<br>`id: string (uuid)`<br>**Body:**<br>`name?: string` | `ValidationError`<br>`StandardError`<br>*(400, 401, 404)* | `resources:write` |
| `/api/v1/resources/:id` | `DELETE` | **Params:**<br>`id: string (uuid)` | `StandardError`<br>*(401, 403, 404)* | `resources:delete` |