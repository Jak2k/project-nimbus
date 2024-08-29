import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

export default defineConfig({
  shortcuts: [
    ["btn", "m-1 p-1 hover:rounded rounded-full dark:text-black"],
    [
      "inp",
      "m-1 p-1 hover:rounded rounded-full focus:rounded bg-gray-100 dark:bg-gray-800 dark:text-gray-100 text-gray-900",
    ],
  ],
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
    presetTypography(),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  safelist: "prose m-auto text-left".split(" "),
});
