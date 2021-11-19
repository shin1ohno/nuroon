// @ts-ignore
import {expect, suite, test} from '@shin1ohno/nuroon/test';
// @ts-ignore
import {Bootstrap} from '@shin1ohno/nuroon/bootstrap';

@suite
class BootstrapTest {
    private boostrap: Bootstrap;

    before() {
        this.boostrap = new Bootstrap();
    }

    @test 'should be constructed successfully'() {
        expect(this.boostrap).not.eq(undefined);
    }

    after() {
        this.boostrap = undefined;
    }
}
