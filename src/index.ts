import { JupyterLab, JupyterLabPlugin } from '@jupyterlab/application';

import { ICommandPalette, IThemeManager } from '@jupyterlab/apputils';

import { ISettingRegistry, PathExt } from '@jupyterlab/coreutils';

import { IDocumentManager } from '@jupyterlab/docmanager';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { IEditorTracker } from '@jupyterlab/fileeditor';

import { DockLayout } from '@phosphor/widgets';

import { PythonBytecodePanel } from './panel';

import '../style/index.css';

namespace CommandIDs {
  /**
   * Create a new panel to show Python Bytecode
   */
  export const create = `pythonbytecode:create`;
}

/**
 * The options used to create a panel
 */
interface ICreateOptions extends Partial<PythonBytecodePanel.IOptions> {
  ref?: string | null;
  insertMode?: DockLayout.InsertMode;
}

/**
 * Activate the plugin
 */
let activateByteCodePlugin = async (
  app: JupyterLab,
  browserFactory: IFileBrowserFactory,
  docManager: IDocumentManager,
  editorTracker: IEditorTracker,
  palette: ICommandPalette,
  settingsRegistry: ISettingRegistry,
  themeManager: IThemeManager,
) => {
  const { commands, serviceManager, shell } = app;

  /**
   * Create a Python bytecode panel for a given path to a Python file
   */
  const createPythonBytecodePanel = async (
    options: ICreateOptions,
  ): Promise<PythonBytecodePanel> => {
    const settings = await settingsRegistry.load(extension.id);
    const userSettings = settings.composite;

    await serviceManager.ready;

    let panel = new PythonBytecodePanel({
      serviceManager,
      docManager,
      themeManager,
      userSettings,
      ...(options as Partial<PythonBytecodePanel.IOptions>),
    });

    await panel.setup();

    const { panelInsertMode } = userSettings;
    const insertMode = `split-${panelInsertMode}` as DockLayout.InsertMode;
    shell.addToMainArea(panel, {
      mode: insertMode,
      ref: options.ref,
    });
    return panel;
  };

  commands.addCommand(CommandIDs.create, {
    execute: args => {
      let widget = editorTracker.currentWidget;
      if (!widget) {
        return;
      }

      let basePath =
        (args['basePath'] as string) ||
        (args['cwd'] as string) ||
        browserFactory.defaultBrowser.model.path;

      return createPythonBytecodePanel({
        basePath: basePath,
        path: widget.context.path,
        ref: widget.id,
      });
    },
    isEnabled: () => {
      return (
        editorTracker.currentWidget !== null &&
        editorTracker.currentWidget === shell.currentWidget
      );
    },
    isVisible: () => {
      let widget = editorTracker.currentWidget;
      return (
        (widget && PathExt.extname(widget.context.path) === '.py') || false
      );
    },
    label: 'Show Python Bytecode',
  });

  app.contextMenu.addItem({
    command: CommandIDs.create,
    selector: '.jp-FileEditor',
  });

  palette.addItem({
    command: CommandIDs.create,
    category: 'File Operations',
  });

  console.log('JupyterLab extension jupyterlab-python-bytecode is activated!');
};

/**
 * Initialization data for the jupyterlab-python-bytecode extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab-python-bytecode:plugin',
  autoStart: true,
  activate: activateByteCodePlugin,
  requires: [
    IFileBrowserFactory,
    IDocumentManager,
    IEditorTracker,
    ICommandPalette,
    ISettingRegistry,
    IThemeManager,
  ],
};

export default extension;
