export const dynamic = 'force-static';

export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
        }}>
          <h1 style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem' }}>404</h1>
          <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem' }}>Page not found</p>
          <a href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>Go back home</a>
        </div>
      </body>
    </html>
  );
}
