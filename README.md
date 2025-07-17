# Solway tunnel innovation project

An example of how to use ontologies to form reliable project plans, profiiling different approaches all focused around the example of building a tunnel under the Solway Firth


## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start the development server**
   ```bash
   npm start
   ```
By default this serves the `portfolio-state-machine` template. The server loads the template app at [http://localhost:3000](http://localhost:3000). Future apps can be served by setting `APP=<app-name>`.

3. **Run tests**
   ```bash
   npm test
   ```
   This launches [Vitest](https://vitest.dev/) in watch mode.

4. **Create a production build**
   ```bash
   npm run build
   ```
   The build script iterates over every folder in `apps/` and writes the optimised output under `docs/apps/<app-name>`.

5. **Preview the production build locally**
   ```bash
   npm run preview
   ```
   Pass `APP=<app-name>` to preview a specific build.

## Project Structure

- `apps/<app-name>/` – individual applications with their own `src` and `index.html`.
- `src/common/` – shared utilities like `index.css`, `reportWebVitals.js` and test setup.
- `vite.config.js` – uses the `APP` environment variable to select which app to serve or build.
- `scripts/build-all.js` – builds every app found in `apps/`.

## Adding a New App

1. Create `apps/<app-name>/` with a `src` folder and `index.html`. Include `<a href="../../index.html">Back to app index</a>` in the HTML.
2. Add a screenshot as `pics/<number>.png` and a row to `app-index.csv` with the same number in the `#` column.
3. Run and test locally with `APP=<app-name> npm start` and `npm test`.
4. Build with `npm run build` when ready.
## Design & Style Guidelines

- Use the shared `common.css` stylesheet with a relative path in every static app.
- `common.css` imports the Inter font and defines base spacing, heading rules and `.btn` classes.
- Include a viewport meta tag and design layouts responsively.
- Keep asset paths relative (avoid leading `/`). React apps should set `basename={import.meta.env.BASE_URL}` on the router.
- Embed small datasets inline so pages open without a server.


## Deploying to GitHub Pages

Push your changes to the **main** branch and enable GitHub Pages in the repo settings using *Deploy from branch* with the root folder. Each app folder then becomes available at:

```
https://<org>.github.io/<repo>/<app-folder>/
```

## Learn More

- [Vite documentation](https://vitejs.dev/guide/)
- [Vitest documentation](https://vitest.dev/guide/)
- [React documentation](https://reactjs.org/)

## License

This project is licensed under the [MIT License](LICENSE).
