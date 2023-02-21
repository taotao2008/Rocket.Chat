/* eslint-disable import/first */
import { expect } from 'chai';
import proxyquire from 'proxyquire';

const fetchStub = {
	fetch: () => Promise.resolve({}),
};

const { MatrixBridge } = proxyquire.noCallThru().load('../../../../../../../../app/federation-v2/server/infrastructure/matrix/Bridge', {
	'../../../../../server/lib/http/fetch': fetchStub,
});

describe('Federation - Infrastructure - Matrix - Bridge', () => {
	const defaultProxyDomain = 'server.com';
	const bridge = new MatrixBridge('', '', defaultProxyDomain, '', 3030, {} as any, () => {}); // eslint-disable-line

	describe('#isUserIdFromTheSameHomeserver()', () => {
		it('should return true if the userId is from the same homeserver', () => {
			expect(bridge.isUserIdFromTheSameHomeserver('@user:server.com', 'server.com')).to.be.true;
		});

		it('should return false if the userId is from a different homeserver', () => {
			expect(bridge.isUserIdFromTheSameHomeserver('@user:server2.com', 'server.com')).to.be.false;
		});
	});

	describe('#extractHomeserverOrigin()', () => {
		it('should return the proxy homeserver origin if there is no server in the userId', () => {
			expect(bridge.extractHomeserverOrigin('@user')).to.be.equal(defaultProxyDomain);
		});

		it('should return the homeserver origin if there is a server in the userId', () => {
			expect(bridge.extractHomeserverOrigin('@user:matrix.org')).to.be.equal('matrix.org');
		});
	});

	describe('#isRoomFromTheSameHomeserver()', () => {
		it('should return true if the room is from the same homeserver', () => {
			expect(bridge.isRoomFromTheSameHomeserver('!room:server.com', 'server.com')).to.be.true;
		});

		it('should return false if the room is from a different homeserver', () => {
			expect(bridge.isRoomFromTheSameHomeserver('!room:server2.com', 'server.com')).to.be.false;
		});
	});

	describe('#verifyInviteeId()', () => {
		it('should return `valid-invitee-id` when the matrixId exists', async () => {
			fetchStub.fetch = () => Promise.resolve({ status: 400, json: () => Promise.resolve({ errcode: 'M_USER_IN_USE' }) })

			const verificationStatus = await bridge.verifyInviteeId('@user:server.com');

			expect(verificationStatus).to.be.equal('valid-invitee-id');
		});

		it('should return `invalid-invitee-id` when the matrixId does not exists', async () => {
			fetchStub.fetch = () => Promise.resolve({ status: 200, json: () => Promise.resolve({}) });

			const verificationStatus = await bridge.verifyInviteeId('@user:server.com');

			expect(verificationStatus).to.be.equal('invalid-invitee-id');
		});

		it('should return `unable-to-verify` when the fetch() call fails', async () => {
			fetchStub.fetch = () => Promise.reject(new Error('Error'));

			const verificationStatus = await bridge.verifyInviteeId('@user:server.com');

			expect(verificationStatus).to.be.equal('unable-to-verify');
		});

		it('should return `unable-to-verify` when an unexepected status comes', async () => {
			fetchStub.fetch = () => Promise.resolve({ status: 500 });

			const verificationStatus = await bridge.verifyInviteeId('@user:server.com');

			expect(verificationStatus).to.be.equal('unable-to-verify');
		});
	});
});
