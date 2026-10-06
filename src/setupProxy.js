const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
    app.use(
        createProxyMiddleware({
            pathFilter: ["/api/click", "/api/writing", "/uploads"],
            target: "http://localhost:5000",
            changeOrigin: true,
        })
    );

    app.use(
        createProxyMiddleware({
            pathFilter: "/api",
            target: "http://localhost:5000",
            changeOrigin: true,
            pathRewrite: { "^/api": "" },
        })
    );
};