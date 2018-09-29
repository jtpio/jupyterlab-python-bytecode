import {
  ClientSession,
  IClientSession,
  IThemeManager,
} from '@jupyterlab/apputils';

import { IDocumentManager } from '@jupyterlab/docmanager';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { ServiceManager } from '@jupyterlab/services';

import { JSONObject } from '@phosphor/coreutils';

import { Message } from '@phosphor/messaging';

import { Panel } from '@phosphor/widgets';

import { BytecodeModel } from './model';

import { BytecodeView } from './view';

const ICON_CLASS = 'jp-PythonIcon';

export class PythonBytecodePanel extends Panel {
  constructor(options: PythonBytecodePanel.IOptions) {
    super();

    const count = Private.count++;
    this.id = `PythonBytecodePanel-${count}`;
    this.title.label = 'Python Bytecode';
    this.title.closable = true;
    this.title.icon = ICON_CLASS;

    let {
      path,
      name,
      serviceManager,
      docManager,
      themeManager,
      userSettings,
    } = options;

    let widget = docManager.findWidget(path);
    this._fileContext = docManager.contextForWidget(widget);
    this._docManager = docManager;
    this._themeManager = themeManager;

    const { kernelLanguagePreference, kernelAutoStart } = userSettings;

    this._session = new ClientSession({
      manager: serviceManager.sessions,
      path,
      name: name || `Python Bytecode`,
      type: 'console',
      kernelPreference: {
        language: kernelLanguagePreference as string,
        autoStartDefault: kernelAutoStart as boolean,
      },
    });

    this._model = new BytecodeModel();
    this._view = new BytecodeView(this._model);

    this.addWidget(this._view);
  }

  public async setup(): Promise<any> {
    await this._session.initialize();
    await this._session.ready;
    await this._getFileContent();
    await this._changeTheme();
    await this._setupListeners();
  }

  protected onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.dispose();
  }

  protected _setupListeners() {
    this._fileContext.fileChanged.connect(
      this._getFileContent,
      this,
    );
    this._fileContext.disposed.connect(
      this.dispose,
      this,
    );
    this._themeManager.themeChanged.connect(
      this._changeTheme,
      this,
    );
    this._session.kernelChanged.connect(
      this._handleKernelChanged,
      this,
    );
  }

  protected _removeListeners() {
    this._fileContext.fileChanged.disconnect(this._getFileContent, this);
    this._fileContext.disposed.disconnect(this.dispose, this);
    this._themeManager.themeChanged.disconnect(this._changeTheme, this);
    this._session.kernelChanged.disconnect(this._handleKernelChanged, this);
  }

  protected async _getFileContent(): Promise<any> {
    const path = this._fileContext.path;
    const file = await this._docManager.services.contents.get(path);
    const msg = this._model.formatKernelMessage(file.content);
    return this._execute(msg);
  }

  protected async _execute(code: string): Promise<any> {
    let future = this._session.kernel.requestExecute({ code }, true);
    future.onIOPub = this._model.handleKernelMessage;
    return future.done;
  }

  protected _changeTheme() {
    const isLight = this._themeManager.isLight(this._themeManager.theme);
    this._model.isLight = isLight;
    this._model.notify();
  }

  protected _handleKernelChanged() {
    if (!this._session.kernel) {
      this.dispose();
      return;
    }
  }

  dispose(): void {
    console.log('dispose panel');
    // TODO: dispose session if last panel disposed?
    this._removeListeners();
    this._session.dispose();
    this._view.dispose();
    this._model.dispose();
    super.dispose();
  }

  get model(): BytecodeModel {
    return this._model;
  }

  get session(): IClientSession {
    return this._session;
  }

  private _fileContext: DocumentRegistry.IContext<DocumentRegistry.IModel>;
  private _docManager: IDocumentManager;
  private _themeManager: IThemeManager;
  private _session: ClientSession;
  private _model: BytecodeModel;
  private _view: BytecodeView;
}

export namespace PythonBytecodePanel {
  export interface IOptions {
    /**
     * The service manager used to get a list
     * of sessions
     */
    serviceManager: ServiceManager.IManager;

    /**
     * The document manager is used to get a context
     * for the file being edited
     */
    docManager: IDocumentManager;

    /**
     * The theme manager used by the panel
     * to control the style of code highlighting
     */
    themeManager: IThemeManager;

    /**
     * Use preferences for the bytecode extension
     */
    userSettings: JSONObject;

    /**
     * Path of an existing session
     */
    path?: string;

    /**
     * The base path for a new client session
     */
    basePath?: string;

    /**
     * The name of the client session
     */
    name?: string;

    /**
     * A kernel preference.
     */
    kernelPreference?: IClientSession.IKernelPreference;
  }
}

namespace Private {
  /**
   * Counter for new panels
   */
  export let count = 1;
}
