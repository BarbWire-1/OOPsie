// TODO idae to integrate mixin pattern from mix and match project

```
//syntax
MyClass:
	//@mixins: LoggerMixin, Timestamped
	uses: LoggerMixin, Timestamped
	props:
		name: string
```
=> store as MixinMap in JSON