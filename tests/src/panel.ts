import { expect } from 'chai';

import { ServiceManager } from '@jupyterlab/services';
import { ObservableMap } from '@jupyterlab/observables';
import { DocumentManager } from '@jupyterlab/docmanager';
import {
  DocumentRegistry,
  TextModelFactory,
  ABCWidgetFactory,
  IDocumentWidget,
  DocumentWidget,
} from '@jupyterlab/docregistry';
import { Widget } from '@phosphor/widgets';

import { PythonBytecodePanel } from '../../lib/panel';
import { CodeEditor } from '@jupyterlab/codeeditor';

class WidgetFactory extends ABCWidgetFactory<IDocumentWidget> {
  protected createNewWidget(
    context: DocumentRegistry.Context,
  ): IDocumentWidget {
    const content = new Widget();
    const widget = new DocumentWidget({ content, context });
    widget.addClass('WidgetFactory');
    return widget;
  }
}

describe('BytecodePanel', () => {
  const serviceManager = new ServiceManager();

  const registry = new DocumentRegistry({
    textModelFactory: new TextModelFactory(),
  });

  const widgetFactory = new WidgetFactory({
    name: 'test',
    fileTypes: ['python'],
    canStartKernel: true,
    preferKernel: true,
  });

  registry.addWidgetFactory(widgetFactory);
  DocumentRegistry.defaultFileTypes.forEach(ft => {
    registry.addFileType(ft);
  });

  const opener: DocumentManager.IWidgetOpener = {
    open: widget => {
      /* no op */
    },
  };
  const docManager = new DocumentManager({
    registry,
    opener,
    manager: serviceManager,
  });

  let panel: PythonBytecodePanel;

  beforeEach(async () => {
    await serviceManager.ready;

    const model = await serviceManager.contents.newUntitled({
      type: 'file',
      ext: '.py',
    });

    docManager.createNew(model.path, 'default');

    panel = new PythonBytecodePanel({
      path: model.path,
      name: 'Test Panel',
      serviceManager,
      docManager,
      themeManager: null,
      selections: new ObservableMap<CodeEditor.ITextSelection[]>(),
      userSettings: {
        kernelLanguagePreference: 'python3',
        kernelAutoStart: true,
      },
    });

    await panel.setup();
  });

  afterEach(() => {
    panel.dispose();
  });

  describe('session', () => {
    it('should start the session', async () => {
      expect(panel.session.isReady).to.equal(true);
    });
  });

  describe('ui', () => {
    it('should show the kernel display name', async () => {
      expect(panel.title.label).to.equal('Echo Kernel Bytecode');
    });
  });

  describe('dispose', () => {
    it('should terminate the session', async () => {
      panel.dispose();
      expect(panel.session.isDisposed).to.equal(true);
    });
  });
});
