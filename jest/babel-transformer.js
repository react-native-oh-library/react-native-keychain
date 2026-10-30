/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const babel = require('@babel/core');
const istanbulPluginPath = require.resolve('babel-plugin-istanbul');
const jestHoistPluginPath = require.resolve('babel-plugin-jest-hoist');

const presetEnvPath = require.resolve('@babel/preset-env');
const presetTypeScriptPath = require.resolve('@babel/preset-typescript');

/**
 * Two-phase transform for TypeScript sources:
 *
 * Phase 1 strips Flow-free TS types and compiles ESM to CJS with
 * preset-env + preset-typescript.
 *
 * Phase 2 (coverage runs only) applies babel-plugin-istanbul on the
 * plain-JS output. babel runs plugins before presets, so instrumenting
 * in a single pass would make istanbul visit the untransformed TS AST,
 * where enum-only or re-export-only files contain no recognizable JS
 * statements and end up with an empty statementMap (0% forever).
 */
const transformer = {
  canInstrument: true,

  process(sourceText, sourcePath, options) {
    const compiled = babel.transformSync(sourceText, {
      babelrc: false,
      configFile: false,
      cwd: options.config.cwd,
      filename: sourcePath,
      plugins: [jestHoistPluginPath],
      presets: [
        [presetEnvPath, { targets: { node: 'current' } }],
        presetTypeScriptPath,
      ],
      sourceMaps: true,
    });

    if (!options.instrument) {
      return { code: compiled.code, map: compiled.map };
    }

    const instrumented = babel.transformSync(compiled.code, {
      babelrc: false,
      configFile: false,
      cwd: options.config.cwd,
      filename: sourcePath,
      plugins: [
        [
          istanbulPluginPath,
          {
            cwd: options.config.cwd,
            exclude: [],
            inputSourceMap: compiled.map,
            useInlineSourceMaps: false,
          },
        ],
      ],
      sourceMaps: true,
    });

    return { code: instrumented.code, map: instrumented.map };
  },
};

module.exports = transformer;
