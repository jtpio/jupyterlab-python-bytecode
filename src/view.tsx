import { VDomRenderer } from '@jupyterlab/apputils';

import * as React from 'react';

import SyntaxHighlighter from 'react-syntax-highlighter';

import {
  arduinoLight,
  tomorrowNight,
} from 'react-syntax-highlighter/dist/styles/hljs';

delete tomorrowNight.hljs['background'];
delete arduinoLight.hljs['background'];

import { BytecodeModel } from './model';
import { parseBytecode } from './utils';

const BYTECODE_PANEL_CLASS = 'jp-RenderedPythonBytecode';
const BYTECODE_ERROR_CLASS = 'jp-RenderedPythonBytecodeError';
const BYTECODE_HIGHLIGHT = 'jp-HighlightBytecode';

export class BytecodeView extends VDomRenderer<any> {
  constructor(model: BytecodeModel) {
    super();
    this.id = 'PythonBytecode';
    this.model = model;
    this.addClass(BYTECODE_PANEL_CLASS);
  }

  protected render(): React.ReactElement<any> {
    if (this.model.error) {
      return <div className={BYTECODE_ERROR_CLASS}>{this.model.error}</div>;
    }
    const theme = this.model.isLight ? arduinoLight : tomorrowNight;
    const elements = parseBytecode(this.model.output);
    const selectedLines = this.model.selectedLines;

    let out = elements.map((block, i) => {
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
}
