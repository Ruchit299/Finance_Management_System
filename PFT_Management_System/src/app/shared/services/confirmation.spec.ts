import { TestBed } from '@angular/core/testing';

import { ConfirmationService } from './confirmation';

describe('Confirmation', () => {
  let service: ConfirmationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
