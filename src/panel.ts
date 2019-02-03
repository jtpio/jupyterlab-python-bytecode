import {
  ClientSession,
  IClientSession,
  IThemeManager,
} from '@jupyterlab/apputils';

import { IObservableMap } from '@jupyterlab/observables';

import { CodeEditor } from '@jupyterlab/codeeditor';

import { ActivityMonitor } from '@jupyterlab/coreutils';

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
    this.id = `${PythonBytecodePanel.NAMESPACE}-${count}`;
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
      selections,
    } = options;

    let widget = docManager.findWidget(path);
    this._fileContext = docManager.contextForWidget(widget);
    this._docManager = docManager;
    this._themeManager = themeManager;
    this._selections = selections;

    const { kernelLanguagePreference, kernelAutoStart } = userSettings;

    name = name || widget.context.contentsModel.name;

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

    this._monitor = new ActivityMonitor({
      signal: this._fileContext.model.contentChanged,
      timeout: 500,
    });

    this._model = new BytecodeModel();
    this._view = new BytecodeView(this._model);

    this.addWidget(this._view);
  }

  public async setup(): Promise<any> {
    await this._session.initialize();
    await this._session.ready;
    await this._setupListeners();

    // do not block on first request
    this._getFileContent();
    this._changeTheme();
  }

  protected onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.dispose();
  }

  protected _setupListeners() {
    this._monitor.activityStopped.connect(
      this._getModelContent,
      this,
    );
    this._fileContext.fileChanged.connect(
      this._getFileContent,
      this,
    );
    this._fileContext.disposed.connect(
      this.dispose,
      this,
    );
    this._selections.changed.connect(
      this._handleSelectionChanged,
      this,
    );
    this._session.kernelChanged.connect(
      this._handleKernelChanged,
      this,
    );

    // TODO: make themeManager optional
    if (this._themeManager) {
      this._themeManager.themeChanged.connect(
        this._changeTheme,
        this,
      );
    }
  }

  protected _removeListeners() {
    if (this._monitor) {
      this._monitor.activityStopped.disconnect(this._getModelContent, this);
      this._monitor.dispose();
    }
    if (this._fileContext) {
      this._fileContext.fileChanged.disconnect(this._getFileContent, this);
      this._fileContext.disposed.disconnect(this.dispose, this);
    }
    if (this._themeManager) {
      this._themeManager.themeChanged.disconnect(this._changeTheme, this);
    }
    if (this._selections) {
      this._selections.changed.disconnect(this._handleSelectionChanged, this);
    }
    this._session.kernelChanged.disconnect(this._handleKernelChanged, this);
  }

  protected _evaluateContent(content: string): Promise<any> {
    const msg = this._model.formatKernelMessage(content);
    return this._execute(msg);
  }

  protected async _getModelContent(): Promise<any> {
    const content = this._fileContext.model.toString();
    return this._evaluateContent(content);
  }

  protected async _getFileContent(): Promise<any> {
    const path = this._fileContext.path;
    const file = await this._docManager.services.contents.get(path);
    return this._evaluateContent(file.content);
  }

  protected async _execute(code: string): Promise<any> {
    let future = this._session.kernel.requestExecute({ code }, true);
    future.onIOPub = this._model.handleKernelMessage;
    return future.done;
  }

  protected _changeTheme() {
    if (!this._themeManager) {
      return;
    }
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

  protected _handleSelectionChanged() {
    console.log(this._selections);
  }

  dispose(): void {
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

  private _monitor: ActivityMonitor<any, any> | null;
  private _fileContext: DocumentRegistry.IContext<DocumentRegistry.IModel>;
  private _docManager: IDocumentManager;
  private _themeManager: IThemeManager;
  private _selections: IObservableMap<CodeEditor.ITextSelection[]>;
  private _session: ClientSession;
  private _model: BytecodeModel;
  private _view: BytecodeView;
}

export namespace PythonBytecodePanel {
  export const NAMESPACE = 'PythonBytecodePanel';

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
     * Editor selections
     */
    selections: IObservableMap<CodeEditor.ITextSelection[]>;

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
