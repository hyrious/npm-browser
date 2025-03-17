# [<samp>NPM Browser</samp>](https://hyrious.me/npm-browser)

<samp>Download and view NPM packages in your browser</samp>

## Usage

### URL Pattern

```yml
https://hyrious.me/npm-browser/?q={name}@{version}/{path}:{line}
```

- View some package's latest contents:\
  <samp>https://hyrious.me/npm-browser/?q=vue</samp>
- View some specific file in some package's specific version:\
  <samp>https://hyrious.me/npm-browser/?q=@github/textarea-autosize@0.3.0/package/dist/index.js:72</samp>

**Useful Functions**:

- Goto some package's homepage/github_repo:\
  Press <kbd>.</kbd> / <kbd>,</kbd>
- Quick open a file:\
  Press <kbd>ctrl + p</kbd>
- Focus current file in sidebar:\
  Press <kbd>alt/option + r</kbd>
- Search source code from all files in some package:\
  Click the :mag: icon
- Open the viewing file in JsDelivr or UNPKG:\
  Click the :link: icon to JsDelivr (pressing <kbd>Alt</kbd> to UNPKG)
- Diff the viewing file with some older version of the package:\
  Click the :page_facing_up: icon, and choose one version to diff

### CLI

```console
$ npx @hyrious/npm-browser [path/to/project]
```

## License

MIT @ [hyrious](https://github.com/hyrious)
