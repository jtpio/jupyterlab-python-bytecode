import { IOutput } from '@jupyterlab/nbformat';

import { KernelMessage } from '@jupyterlab/services';

import { ISignal, Signal } from '@lumino/signaling';

/**
 * The Bytecode model
 */
export class BytecodeModel {
  /**
   * Get the bytecode output.
   */
  get output(): string {
    return this._output;
  }

  /**
   * Get the error message.
   */
  get error(): string {
    return this._error;
  }

  /**
   * Whether this is a light theme.
   */
  get isLight(): boolean {
    return this._isLight;
  }

  /**
   * Set the theme to light or dark.
   * @value true if light, false otherwise
   */
  set isLight(value: boolean) {
    this._isLight = value;
    this._changed.emit(void 0);
  }

  /**
   * Get the selected lines from the editor.
   */
  get selectedLines(): Set<number> {
    return this._selectedLines;
  }

  /**
   * Set the selected lines from the editor.
   * @lines The selected lines.
   */
  set selectedLines(lines: Set<number>) {
    this._selectedLines = lines;
    this._changed.emit(void 0);
  }

  /**
   * A signal emitted when the model changes.
   */
  get changed(): ISignal<BytecodeModel, void> {
    return this._changed;
  }

  /**
   * Handle a message from the kernel.
   */
  handleKernelMessage = (msg: KernelMessage.IIOPubMessage) => {
    const msgType = msg.header.msg_type;
    const message = msg.content as IOutput;
    switch (msgType) {
      case 'stream':
        this._output = message.text as string;
        this._error = '';
        this._changed.emit(void 0);
        break;
      case 'error':
        console.error(msg.content);
        this._error = message.evalue as string;
        this._changed.emit(void 0);
        break;
      default:
        break;
    }
  };

  private _output: string = '';
  private _error: string = '';
  private _isLight: boolean = true;
  private _selectedLines: Set<number>;
  private _changed = new Signal<this, void>(this);
}
