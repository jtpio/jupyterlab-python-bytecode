import {
  SessionContext,
  ISessionContext,
  IThemeManager,
  sessionContextDialogs,
  DOMUtils,
} from '@jupyterlab/apputils';

import { IObservableMap } from '@jupyterlab/observables';

import { CodeEditor } from '@jupyterlab/codeeditor';

import { ActivityMonitor } from '@jupyterlab/coreutils';

import { IDocumentManager } from '@jupyterlab/docmanager';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { ServiceManager } from '@jupyterlab/services';

import { pythonIcon } from '@jupyterlab/ui-components';

import { UUID, ReadonlyJSONObject } from '@lumino/coreutils';

import { Message } from '@lumino/messaging';

import { Panel } from '@lumino/widgets';

import { flattenDeep, range } from 'lodash';

import { BytecodeModel } from './model';

import { escapeComments } from './utils';

import { BytecodeView } from './view';

/**
 * The panel that shows the Bytecode preview
 */
export class PythonBytecodePanel extends Panel {
  /**
   * Constructor for the panel.
   *
   * @param options: the instantiation options.
   */
  constructor(options: PythonBytecodePanel.IOptions) {
    super();

    this.id = DOMUtils.createDomID();
    this.title.label = 'Python Bytecode';
    this.title.closable = true;
    this.title.icon = pythonIcon;

    const {
      path,
      serviceManager,
      docManager,
      themeManager,
      userSettings,
      selections,
    } = options;

    const widget = docManager.findWidget(path);
    this._fileContext = docManager.contextForWidget(widget);
    this._docManager = docManager;
    this._themeManager = themeManager;
    this._selections = selections;

    const {
      kernelLanguagePreference,
      kernelAutoStart,
      startNewKernel,
    } = userSettings;

    const name = options.name || widget.context.contentsModel.name;

    this._sessionContext = new SessionContext({
      sessionManager: serviceManager.sessions,
      specsManager: serviceManager.kernelspecs,
      path: startNewKernel ? UUID.uuid4() : path,
      name: name || `Python Bytecode`,
      type: 'console',
      kernelPreference: {
        language: kernelLanguagePreference as string,
        autoStartDefault: (kernelAutoStart as boolean) ?? true,
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

  /**
   * Get the model.
   */
  get model(): BytecodeModel {
    return this._model;
  }

  /**
   * Get the session context.
   */
  get sessionContext(): ISessionContext {
    return this._sessionContext;
  }

  /**
   * Dispose the panel.
   */
  dispose(): void {
    // TODO: dispose session if last panel disposed?
    this._removeListeners();
    this._sessionContext.dispose();
    this._view.dispose();
    super.dispose();
  }

  /**
   * Setup the panel.
   */
  async setup() {
    const value = await this._sessionContext.initialize();
    if (value) {
      await sessionContextDialogs.selectKernel(this._sessionContext);
    }

    const { name, kernelDisplayName } = this._sessionContext;
    if (!name.endsWith(kernelDisplayName)) {
      await this._sessionContext.session?.setName(
        `${name} - ${kernelDisplayName}`,
      );
    }

    this.title.label = `${this._sessionContext.name} Bytecode`;
    this.title.caption = this._sessionContext.name;

    this._setupListeners();

    // do not block on first request
    this._getFileContent();
    this._changeTheme();
  }

  /**
   * Handle onCloseRequest messages.
   * @param msg The message
   */
  protected onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.dispose();
  }

  /**
   * Setup the listeners.
   */
  private _setupListeners() {
    this._monitor.activityStopped.connect(this._getModelContent, this);
    this._fileContext.fileChanged.connect(this._getFileContent, this);
    this._fileContext.disposed.connect(this.dispose, this);
    this._selections.changed.connect(this._handleSelectionChanged, this);
    this._sessionContext.kernelChanged.connect(this._handleKernelChanged, this);

    // TODO: make themeManager optional
    if (this._themeManager) {
      this._themeManager.themeChanged.connect(this._changeTheme, this);
    }
  }

  /**
   * Remove the listeners.
   */
  private _removeListeners() {
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
    this._sessionContext.kernelChanged.disconnect(
      this._handleKernelChanged,
      this,
    );
  }

  /**
   * Evaluate the content of the document.
   * @param content the content to evaluate
   */
  private _evaluateContent(content: string) {
    const msg = Private.formatKernelMessage(content);
    return this._execute(msg);
  }

  /**
   * Get the content of the model.
   */
  private async _getModelContent() {
    const content = this._fileContext.model.toString();
    return this._evaluateContent(content);
  }

  /**
   * Get the content of the file.
   */
  private async _getFileContent() {
    const path = this._fileContext.path;
    const file = await this._docManager.services.contents.get(path);
    return this._evaluateContent(file.content);
  }

  /**
   * Execute code.
   * @param code The code to execute
   */
  private async _execute(code: string) {
    const future = this._sessionContext.session?.kernel?.requestExecute({
      code,
    });
    future.onIOPub = this._model.handleKernelMessage;
    return future.done;
  }

  /**
   * Change the theme to the current theme.
   */
  private _changeTheme() {
    if (!this._themeManager) {
      return;
    }
    const isLight = this._themeManager.isLight(this._themeManager.theme);
    this._model.isLight = isLight;
  }

  /**
   * Handle a kernel changed event.
   */
  private _handleKernelChanged() {
    if (!this._sessionContext.session?.kernel) {
      this.dispose();
      return;
    }
  }

  /**
   * Handle a seleection changed event.
   */
  private _handleSelectionChanged() {
    const selectedLines = flattenDeep<number>(
      this._selections.values().map(s =>
        s.map(e => {
          const [start, end] = [e.start, e.end].sort((a, b) => a.line - b.line);
          let [startLine, endLine] = [start.line, end.line];
          if (startLine != endLine && end.column === 0) {
            endLine--;
          }
          return range(startLine, endLine + 1);
        }),
      ),
    );
    this.model.selectedLines = new Set(selectedLines);
  }

  private _monitor: ActivityMonitor<any, any> | null;
  private _fileContext: DocumentRegistry.IContext<DocumentRegistry.IModel>;
  private _docManager: IDocumentManager;
  private _themeManager: IThemeManager;
  private _selections: IObservableMap<CodeEditor.ITextSelection[]>;
  private _sessionContext: SessionContext;
  private _model: BytecodeModel;
  private _view: BytecodeView;
}

/**
 * A namespace for PythonBytecodePanel statics.
 */
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
    userSettings: ReadonlyJSONObject;

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
    kernelPreference?: ISessionContext.IKernelPreference;
  }
}

namespace Private {
  /**
   * Format the kernel message.
   * @param code the content
   */
  export function formatKernelMessage(code: string): string {
    const escapedContent = escapeComments(code);
    return ['import dis', `dis.dis("""${escapedContent}""")`].join('\n');
  }
}
