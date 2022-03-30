import {
  expect,
  instance,
  mock,
  suite,
  test,
  when,
} from "@shin1ohno/nuroon/test";
import { BootstrapManager } from "@shin1ohno/nuroon/bootstrapManager";
import { BootstrapCore } from "../src/app/roon/bootstrapCore";
import { NuimoControlDevice } from "rocket-nuimo";

const MockedNuimoControlDevice = mock(NuimoControlDevice);

@suite
class BootstrapManagerTest {
  private nuRoon!: BootstrapManager;
  private roonCore!: BootstrapCore;
  private nuimo!: NuimoControlDevice;

  before() {
    this.roonCore = new BootstrapCore();
    let i = 0;
    when(MockedNuimoControlDevice.id).thenReturn(`id-${i++}`);
    this.nuimo = instance(MockedNuimoControlDevice);
    this.nuRoon = new BootstrapManager(this.roonCore, this.nuimo, false);
  }

  after() {
    BootstrapManager.deleteAll();
  }

  @test "pair() should pair the nuimo and the roon core"() {
    expect(() => BootstrapManager.findOrCreate(this.roonCore, this.nuimo))
      .to.change(() => BootstrapManager.all().length)
      .by(1);
  }

  @test "pair() should not add the same pair"() {
    expect(() =>
      Array(10)
        .fill("")
        .forEach((_) => BootstrapManager.findOrCreate(this.roonCore, this.nuimo))
    )
      .to.change(() => BootstrapManager.all().length)
      .by(1);
  }

  @test "find() should find the pair"() {
    const pair = BootstrapManager.findOrCreate(this.roonCore, this.nuimo);
    const anotherPair = BootstrapManager.findOrCreate(
      this.roonCore,
      instance(mock(NuimoControlDevice))
    );
    expect(BootstrapManager.find(this.roonCore, this.nuimo))
      .to.eq(pair)
      .and.not.to.eq(anotherPair);
  }

  @test "find() can also find with fake Nuimo object"() {
    const pair = BootstrapManager.findOrCreate(this.roonCore, this.nuimo);
    expect(BootstrapManager.find(this.roonCore, { id: this.nuimo.id })).to.eq(pair);
  }
}
