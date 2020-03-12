import { expect } from 'chai';

import { BytecodeModel } from '../../lib/model';
import { KernelMessage } from '@jupyterlab/services';

import {
  KERNEL_CONTENT,
  KERNEL_ERROR,
  createKernelContentMessage,
  createKernelErrorMessage,
} from './utils';

describe('BytecodeModel', () => {
  let model: BytecodeModel;

  beforeEach(() => {
    model = new BytecodeModel();
    expect(model.output).to.be.empty;
    expect(model.error).to.be.empty;
  });

  it('should be creatable', () => {
    expect(model).to.be.an.instanceof(BytecodeModel);
  });

  it('should handle stream messages from the kernel', () => {
    const msg = createKernelContentMessage(KERNEL_CONTENT);

    model.handleKernelMessage(msg as KernelMessage.IIOPubMessage);

    expect(model.output).to.eq(KERNEL_CONTENT);
    expect(model.error).to.be.empty;
  });

  it('should handle error messages from the kernel', () => {
    const msg = createKernelErrorMessage(KERNEL_ERROR);

    model.handleKernelMessage(msg as KernelMessage.IIOPubMessage);

    expect(model.output).to.be.empty;
    expect(model.error).to.eq(KERNEL_ERROR);
  });
});
