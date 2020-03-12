import { expect } from 'chai';

import { framePromise } from '@jupyterlab/testutils';

import { KernelMessage } from '@jupyterlab/services';

import { BytecodeModel } from '../../lib/model';
import { BytecodeView } from '../../lib/view';

import {
  createKernelContentMessage,
  createKernelErrorMessage,
  KERNEL_CONTENT,
  KERNEL_ERROR,
} from './utils';

describe('BytecodeView', () => {
  let model: BytecodeModel;
  let view: BytecodeView;

  beforeEach(() => {
    model = new BytecodeModel();
    view = new BytecodeView(model);
  });

  afterEach(() => {
    view.dispose();
  });

  it('should be creatable', () => {
    expect(view).to.be.an.instanceof(BytecodeView);
    expect(view.id).not.to.be.empty;
  });

  it('should render the bytecode output', async () => {
    const msg = createKernelContentMessage(KERNEL_CONTENT);

    model.handleKernelMessage(msg as KernelMessage.IIOPubMessage);
    await framePromise();

    const div = view.node.firstChild as HTMLElement;
    expect(div.nodeName.toLowerCase()).to.eq('div');
    expect(div.children).to.not.be.empty;
    expect(div.textContent).to.equal(KERNEL_CONTENT);
    expect(div.className).to.not.contain('Error');
  });

  it('should render errors', async () => {
    const msg = createKernelErrorMessage(KERNEL_ERROR);

    model.handleKernelMessage(msg as KernelMessage.IIOPubMessage);
    await framePromise();

    const div = view.node.firstChild as HTMLElement;
    expect(div.textContent).to.equal(KERNEL_ERROR);
    expect(div.className).to.contain('Error');
  });
});
