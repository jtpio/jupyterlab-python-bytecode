import { VDomRenderer } from '@jupyterlab/apputils';

import * as React from 'react';

import SyntaxHighlighter from 'react-syntax-highlighter';

import {
  arduinoLight,
  tomorrowNight,
} from 'react-syntax-highlighter/styles/hljs';

import { BytecodeModel } from './model';

const BYTECODE_PANEL_CLASS = 'jp-RenderedPythonBytecode';
const BYTECODE_ERROR_CLASS = 'jp-RenderedPythonBytecodeError';

const LINE_REGEX = /(^\s{2}(\d+)(?:(.|\r\n|\r|\n))+?(\r\n|\r|\n){2})/gim;

export class BytecodeView extends VDomRenderer<any> {
  constructor(model: BytecodeModel) {
    super();
    this.id = 'PythonBytecode';
    this.model = model;
    this.addClass(BYTECODE_PANEL_CLASS);
  }

  protected formatBytecode(code: string): string[] {
    const matches = code.match(LINE_REGEX);
    return matches;
  }

  protected render(): React.ReactElement<any> {
    if (this.model.error) {
      return <div className={BYTECODE_ERROR_CLASS}>{this.model.error}</div>;
    }

    const code = this.model.output;
    const theme = this.model.isLight ? arduinoLight : tomorrowNight;

    const elements = this.formatBytecode(code) || [];

    delete tomorrowNight.hljs['background'];
    let out = elements.map(line => {
      return (
        <SyntaxHighlighter language="python" style={theme} wrapLines={true}>
          {line}
        </SyntaxHighlighter>
      );
    });
    return <div>{out}</div>;
  }
}
