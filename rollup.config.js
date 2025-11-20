import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const config = {
  input: "src/index.js",
  output: {
    esModule: true,
    file: "dist/index.js",
    format: "es",
    sourcemap: true,
    /**
     * 打包过程中存在动态导入（如按需引入 formdata-node 等依赖），
     * 需要开启 inlineDynamicImports 以生成单文件 bundle，避免 Rollup 报错。
     */
    inlineDynamicImports: true,
  },
  plugins: [commonjs(), nodeResolve({ preferBuiltins: true })],
};

export default config;
