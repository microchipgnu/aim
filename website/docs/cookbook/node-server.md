```javascript
import { createServer } from "@aim-sdk/server";
import { join } from 'path';

createServer({
  port: 3000,
  hostname: '0.0.0.0',
  routesDir: join(__dirname, 'routes')
});
```

```markdown
aim/
├── routes/ # AIM routes
│ ├── doc1.md
│ └── doc3.md
└── .env # Environment variables
```