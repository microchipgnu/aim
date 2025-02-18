export function getHomePage(routes: { path: string, file: string }[]) {
    return `
    <!DOCTYPE html>
    <html>
        <head>
            <title>AIM Local Server</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        </head>
        <body class="font-sans bg-gray-50">
            <div class="max-w-6xl mx-auto p-8">
                <div class="bg-white rounded-xl shadow-sm p-8 mb-8">
                    <div class="flex items-center gap-3 mb-4">
                        <i class="fas fa-robot text-3xl text-blue-600"></i>
                        <h1 class="text-3xl font-bold text-gray-900">AIM Local Server</h1>
                    </div>
                    <p class="text-gray-600 text-lg">Welcome to the AIM Local Server - your local development environment for AIM documents.</p>
                    <div class="mt-4">
                        <a href="https://aim.microchipgnu.pt" 
                           class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors">
                            <span>Learn more about AIM</span>
                            <i class="fas fa-external-link-alt text-sm"></i>
                        </a>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <i class="fas fa-route text-blue-600"></i>
                        Available Routes
                        <span class="ml-2 text-sm font-normal text-gray-500">(${routes.length} total)</span>
                    </h2>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${routes.map(route => `
                        <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
                            <div class="p-6">
                                <div class="flex items-start justify-between">
                                    <div>
                                        <a href="/${route.path}" class="font-mono text-lg font-medium text-blue-600 hover:text-blue-800 transition-colors">
                                            /${route.path}
                                        </a>
                                        <div class="mt-1 text-gray-500 text-sm flex items-center gap-2">
                                            <i class="fas fa-file-code"></i>
                                            ${route.file}
                                        </div>
                                    </div>
                                    <a href="/${route.path}" class="text-gray-400 hover:text-blue-600 transition-colors">
                                        <i class="fas fa-arrow-right"></i>
                                    </a>
                                </div>
                                
                                <div class="mt-4 space-y-2">
                                    <div class="flex items-center gap-2">
                                        <span class="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-md">GET</span>
                                        <span class="text-sm text-gray-600">View document & metadata</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-md">POST</span>
                                        <span class="text-sm text-gray-600">Execute document</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </body>
    </html>
    `;
}
