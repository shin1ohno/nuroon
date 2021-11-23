import {
  expect,
  instance,
  mock,
  suite,
  test,
  when,
} from "@shin1ohno/nuroon/test";
import { NuRoon } from "@shin1ohno/nuroon/nuRoon";
import { BootstrapCore } from "../src/app/roon/bootstrapCore";
import { NuimoControlDevice } from "rocket-nuimo";

const MockedNuimoControlDevice = mock(NuimoControlDevice);

@suite
class NuRoonTest {
  private nuRoon!: NuRoon;
  private roonCore!: BootstrapCore;
  private nuimo!: NuimoControlDevice;

  before() {
    this.roonCore = new BootstrapCore();
    let i = 0;
    when(MockedNuimoControlDevice.id).thenReturn(`id-${i++}`);
    this.nuimo = instance(MockedNuimoControlDevice);
    this.nuRoon = new NuRoon(this.roonCore, this.nuimo, false);
  }

  after() {
    NuRoon.deleteAll();
  }

  @test "pair() should pair the nuimo and the roon core"() {
    expect(() => NuRoon.findOrCreate(this.roonCore, this.nuimo))
      .to.change(() => NuRoon.all().length)
      .by(1);
  }

  @test "pair() should not add the same pair"() {
    expect(() =>
      Array(10)
        .fill("")
        .forEach((_) => NuRoon.findOrCreate(this.roonCore, this.nuimo))
    )
      .to.change(() => NuRoon.all().length)
      .by(1);
  }

  @test "find() should find the pair"() {
    const pair = NuRoon.findOrCreate(this.roonCore, this.nuimo);
    const anotherPair = NuRoon.findOrCreate(
      this.roonCore,
      instance(mock(NuimoControlDevice))
    );
    expect(NuRoon.find(this.roonCore, this.nuimo))
      .to.eq(pair)
      .and.not.to.eq(anotherPair);
  }

  @test "find() can also find with fake Nuimo object"() {
    const pair = NuRoon.findOrCreate(this.roonCore, this.nuimo);
    expect(NuRoon.find(this.roonCore, { id: this.nuimo.id })).to.eq(pair);
  }
}
