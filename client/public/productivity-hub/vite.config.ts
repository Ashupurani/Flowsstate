import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	root: path.resolve(import.meta.dirname, "client"),
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "client", "src"),
			"@shared/schema": path.resolve(import.meta.dirname, "shared", "schema.ts"),
			"@shared": path.resolve(import.meta.dirname, "shared"),
		},
	},
	build: {
		outDir: path.resolve(import.meta.dirname, "dist", "public"),
		emptyOutDir: true,
	},
});
