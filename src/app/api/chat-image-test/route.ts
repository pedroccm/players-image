import { NextResponse } from "next/server"

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Chat Image Test</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Chat Image Route Working!</h1>
        <p>This proves the route is accessible without middleware interference.</p>
        <p>If you see this, the problem is with the page route, not the middleware.</p>
      </div>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}