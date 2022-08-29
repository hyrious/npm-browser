import { writeFileSync } from "fs";
import { fetch, json } from "./helpers";

const baseUrl = "https://raw.githubusercontent.com/braver/FileIcons/master";
// const baseUrl = "https://cdn.jsdelivr.net/gh/braver/FileIcons";

console.log(". icons | colors");
const [icons, colors] = await Promise.all([
  json(`${baseUrl}/build/icons.json`, "icons.json"),
  json(`${baseUrl}/build/colors.json`, "colors.json"),
]);

const result: Record<string, string> = {};

const tasks: Promise<unknown>[] = [];
for (const [name, color] of Object.entries(icons)) {
  const type = name.replace(/^file_type_/, "");
  tasks.push(
    fetch(`${baseUrl}/build/assets/${name}.svg`, `${name}.svg`).then((svg) => {
      const hsl: string = colors[color as string];
      const rendered = svg.replace('xmlns="http://www.w3.org/2000/svg" ', "").replace("#000", hsl);
      console.log(".", type);
      result[type] = rendered;
    })
  );
}
await Promise.all(tasks);

writeFileSync("scripts/file-icons.json", JSON.stringify(result, null, 2));
