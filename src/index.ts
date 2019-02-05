import {
  JupyterLab,
  JupyterLabPlugin,
  ILayoutRestorer,
} from '@jupyterlab/application';

import {
  ICommandPalette,
  IThemeManager,
  InstanceTracker,
} from '@jupyterlab/apputils';

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

  /**
   * Restore a Python Bytecode panel
   */
  export const open = `pythonbytecode:open`;
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
  restorer: ILayoutRestorer,
  settingsRegistry: ISettingRegistry,
  themeManager: IThemeManager,
) => {
  const { commands, serviceManager, shell } = app;

  const tracker = new InstanceTracker<PythonBytecodePanel>({
    namespace: PythonBytecodePanel.NAMESPACE,
  });

  restorer.restore(tracker, {
    command: CommandIDs.open,
    args: panel => ({
      path: panel.session.path,
      name: panel.session.name,
      ref: panel.id,
    }),
    name: panel => panel.session.path,
  });

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
      selections: options.selections,
      ...(options as Partial<PythonBytecodePanel.IOptions>),
    });

    await panel.setup();

    tracker.add(panel);

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
        selections: widget.content.model.selections,
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

  commands.addCommand(CommandIDs.open, {
    execute: args => {
      const { basePath, path, name, id } = args;
      if (!path || !name) {
        return;
      }

      let widget = editorTracker.currentWidget;
      if (!widget) {
        return;
      }

      return createPythonBytecodePanel({
        basePath:
          (basePath as string) || browserFactory.defaultBrowser.model.path,
        path: path as string,
        selections: widget.content.model.selections,
        name: name as string,
        ref: id as string,
      });
    },
  });

  app.contextMenu.addItem({
    command: CommandIDs.create,
    selector: '.jp-FileEditor',
  });

  palette.addItem({
    command: CommandIDs.create,
    category: 'File Operations',
  });
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
    ILayoutRestorer,
    ISettingRegistry,
    IThemeManager,
  ],
};

export default extension;
