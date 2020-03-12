import { IOutput } from '@jupyterlab/nbformat';

import { KernelMessage } from '@jupyterlab/services';

import { ISignal, Signal } from '@lumino/signaling';

export class BytecodeModel {
  get output(): string {
    return this._output;
  }

  get error(): string {
    return this._error;
  }

  get isLight(): boolean {
    return this._isLight;
  }

  set isLight(value: boolean) {
    this._isLight = value;
    this._changed.emit(void 0);
  }

  get selectedLines(): Set<number> {
    return this._selectedLines;
  }

  set selectedLines(lines: Set<number>) {
    this._selectedLines = lines;
    this._changed.emit(void 0);
  }

  get changed(): ISignal<BytecodeModel, void> {
    return this._changed;
  }

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
