import { VDomRenderer } from '@jupyterlab/apputils';

import * as React from 'react';

import SyntaxHighlighter from 'react-syntax-highlighter';

import {
  arduinoLight,
  tomorrowNight,
} from 'react-syntax-highlighter/styles/hljs';

delete tomorrowNight.hljs['background'];
delete arduinoLight.hljs['background'];

import { BytecodeModel } from './model';

const BYTECODE_PANEL_CLASS = 'jp-RenderedPythonBytecode';
const BYTECODE_ERROR_CLASS = 'jp-RenderedPythonBytecodeError';
const BYTECODE_LIGHT_HIGHLIGHT_CLASS = 'jp-LightHighlightPythonBytecode';
const BYTECODE_DARK_HIGHLIGHT_CLASS = 'jp-DarkHighlightPythonBytecode';

const LINE_REGEX = /(^\s{2}(\d+)(?:(.|\r\n|\r|\n))+?(\r\n|\r|\n){2})/gim;

export class BytecodeView extends VDomRenderer<any> {
  constructor(model: BytecodeModel) {
    super();
    this.id = 'PythonBytecode';
    this.model = model;
    this.addClass(BYTECODE_PANEL_CLASS);
  }

  protected formatBytecode(code: string): any[] {
    let matches = [];
    let match = LINE_REGEX.exec(code);
    while (match != null) {
      matches.push([parseInt(match[2], 10) - 1, '  ' + match[0].trim()]);
      match = LINE_REGEX.exec(code);
    }
    return matches;
  }

  protected render(): React.ReactElement<any> {
    if (this.model.error) {
      return <div className={BYTECODE_ERROR_CLASS}>{this.model.error}</div>;
    }
    const theme = this.model.isLight ? arduinoLight : tomorrowNight;
    const elements = this.formatBytecode(this.model.output);
    const selectedLines = this.model.selectedLines;

    let out = elements.map(block => {
      const [line, code] = block;
      let highlightClass = '';
      if (selectedLines && selectedLines.has(line)) {
        highlightClass = this.model.isLight
          ? BYTECODE_LIGHT_HIGHLIGHT_CLASS
          : BYTECODE_DARK_HIGHLIGHT_CLASS;
      }
      return (
        <div className={highlightClass}>
          <SyntaxHighlighter language="python" style={theme} wrapLines={true}>
            {code}
          </SyntaxHighlighter>
        </div>
      );
    });
    return <div>{out}</div>;
  }
}
