import { ReactWidget } from '@jupyterlab/apputils';

import * as React from 'react';

import SyntaxHighlighter from 'react-syntax-highlighter';

import {
  arduinoLight,
  tomorrowNight,
} from 'react-syntax-highlighter/dist/cjs/styles/hljs';

delete tomorrowNight.hljs['background'];
delete arduinoLight.hljs['background'];

import { BytecodeModel } from './model';

import { parseBytecode } from './utils';

const BYTECODE_PANEL_CLASS = 'jp-RenderedPythonBytecode';
const BYTECODE_ERROR_CLASS = 'jp-RenderedPythonBytecodeError';
const BYTECODE_HIGHLIGHT = 'jp-HighlightBytecode';

export class BytecodeView extends ReactWidget {
  constructor(model: BytecodeModel) {
    super();
    this.id = 'PythonBytecode';
    this._model = model;
    this._model.changed.connect(() => this.update());
    this.addClass(BYTECODE_PANEL_CLASS);
  }

  render() {
    if (this._model.error) {
      return <div className={BYTECODE_ERROR_CLASS}>{this._model.error}</div>;
    }
    const theme = this._model.isLight ? arduinoLight : tomorrowNight;
    const elements = parseBytecode(this._model.output);
    const selectedLines = this._model.selectedLines;

    const out = elements.map((block, i) => {
      const { line, code } = block;
      return (
        <div
          key={`bytecode-block-${i}`}
          className={
            selectedLines && selectedLines.has(line) ? BYTECODE_HIGHLIGHT : ''
          }
        >
          <SyntaxHighlighter language="python" style={theme}>
            {code}
          </SyntaxHighlighter>
        </div>
      );
    });
    return <div>{out}</div>;
  }

  private _model: BytecodeModel;
}
