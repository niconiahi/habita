# File download

This is the endpoint that serves uploaded files — documents, images, PDFs, and anything else stored in the platform. When users click "download" on a document or when images are displayed, they're being served through this endpoint.

Files are access-controlled: users can only download files that belong to properties they have access to, or their own personal documents. The system also caches files for faster subsequent access.

There's a special mode for image processing that bypasses user authentication using a secret key, used internally by the image optimization service.
