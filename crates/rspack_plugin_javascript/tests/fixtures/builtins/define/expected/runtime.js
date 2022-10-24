(function () { // runtime instance
var runtime = new Object();
self['__rspack_runtime__'] = runtime;// mount Modules
(function () {
  runtime.installedModules = {/* __INSTALLED_MODULES__*/};
})();

// mount Chunks
(function () {
  runtime.installedChunks = {};
})();

// mount ModuleCache
(function () {
  runtime.moduleCache = {};
})();(function () {
  runtime.checkById = function (obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
})();// mount PublicPath
(function () {
  runtime.publicPath = "/";
})();// The require function
function __rspack_require__(moduleId) {
	var cachedModule = this.moduleCache[moduleId];
	if (cachedModule !== undefined) {
		return cachedModule.exports;
	}

	// Create a new module (and put it into the cache)
	var module = (this.moduleCache[moduleId] = {
		// no module.id needed
		// no module.loaded needed
		exports: {}
	});

	this.installedModules[moduleId](
		module,
		module.exports,
		this.__rspack_require__.bind(this),
		this.__rspack_dynamic_require__ &&
			this.__rspack_dynamic_require__.bind(this)
	);

	return module.exports;
}

// mount require function
(function () {
	runtime.__rspack_require__ = __rspack_require__;
	// module execution interceptor
	runtime.__rspack_require__.i = [];
})();
// The register function
function __rspack_register__(chunkIds, modules, callback) {
  if (
    chunkIds.some(
      function (id) {
        return this.installedChunks[id] !== 0;
      }.bind(this)
    )
  ) {
    for (moduleId in modules) {
      if (this.checkById(modules, moduleId)) {
        this.installedModules[moduleId] = modules[moduleId];
      }
    }
    if (callback) callback(this.__rspack_require__);
  }
  for (var i = 0; i < chunkIds.length; i++) {
    chunkId = chunkIds[i];
    if (this.checkById(this.installedChunks, chunkId) && this.installedChunks[chunkId]) {
      this.installedChunks[chunkId][0]();
    }
    this.installedChunks[chunkId] = 0;
  }
}

// mount register function
(function () {
  runtime.__rspack_register__ = __rspack_register__;
})();// hot runtime
(function () {
	var currentModuleData = {};
	var installedModules = this.installedModules;

	// module and require creation
	var currentChildModule;
	var currentParents = [];

	// status
	var registeredStatusHandlers = [];
	var currentStatus = "idle";

	// while downloading
	// TODO: not needed in rspack temporary,
	// TODO: because we transfer all changed modules.
	var blockingPromises = 0;
	var blockingPromisesWaiting = [];

	// The update info
	var currentUpdateApplyHandlers;
	var queuedInvalidatedModules;

	runtime.__rspack_require__.hmrD = currentModuleData;
	runtime.__rspack_require__.i.push(function (options) {
		var module = options.module;
		var require = createRequire(options.require, options.id);
		module.hot = createModuleHotObject(options.id, module);
		module.parent = currentParents;
		module.children = [];
		currentParents = [];
		options.require = require;
	});

	runtime.__rspack_require__.hmrC = {};
	// TODO: useless
	runtime.__rspack_require__.hmrI = {};

	function createRequire(require, moduleId) {
		var me = installedModules[moduleId];
		if (!me) {
			return require;
		}
		var fn = function (request) {
			if (me.hot.active) {
				if (installedModules[request]) {
					var parents = installedModules[request].parents;
					if (parents.indexOf(moduleId) === -1) {
						parents.push(moduleId);
					}
				} else {
					currentParents = [moduleId];
					currentChildModule = request;
				}
				if (me.children.indexOf(request) === -1) {
					me.children.push(request);
				}
			} else {
				console.log(
					"[HMR] unexpected require(" +
						request +
						") from disposed module " +
						moduleId
				);
				currentParents = [];
			}
			return require(request);
		};
		var createPropertyDescriptor = function (name) {
			return {
				configurable: true,
				enumerable: true,
				get: function () {
					return require[name];
				},
				set: function (value) {
					require[name] = value;
				}
			};
		};
		for (var name in require) {
			if (Object.prototype.hasOwnProperty.call(require, name) && name !== "e") {
				Object.defineProperty(fn, name, createPropertyDescriptor(name));
			}
		}

		fn.e = function (chunkId) {
			return trackBlockingPromise(require.e(chunkId));
		};

		return fn;
	}

	function createModuleHotObject(moduleId, me) {
		var _main = currentChildModule !== moduleId;
		var hot = {
			_acceptedDependencies: {},
			_acceptedErrorHandlers: {},
			_declinedDependencies: {},
			_selfAccepted: false,
			_selfDeclined: false,
			_selfInvalidated: false,
			_disposeHandlers: [],
			_main: _main,
			_requireSelf: function () {
				currentParents = me.parents.slice();
				currentChildModule = _main ? undefined : moduleId;
				runtime.__rspack_require__(moduleId);
			},
			active: true,
			accpet: function (dep, callback, errorHandler) {
				if (dep === undefined) {
					hot._selfAccepted = true;
				} else if (typeof dep === "function") {
					hot._selfAccepted = dep;
				} else if (typeof dep === "object" && dep !== null) {
					for (var i = 0; i < dep.length; i++) {
						hot._acceptedDependencies[dep[i]] = callback || function () {};
						hot._acceptedErrorHandlers[dep[i]] = errorHandler;
					}
				} else {
					hot._acceptedDependencies[dep] = callback || function () {};
					hot._acceptedErrorHandlers[dep] = errorHandler;
				}
			},
			decline: function (dep) {
				if (dep === undefined) {
					hot._selfDeclined = true;
				} else if (typeof dep === "object" && dep !== null) {
					for (var i = 0; i < dep.length; i++) {
						hot._declinedDependencies[dep[i]] = true;
					}
				} else {
					hot._declinedDependencies[dep] = true;
				}
			},
			dispose: function (callback) {
				hot._disposeHandlers.push(callback);
			},
			addDisposeHandler: function (callback) {
				hot._disposeHandlers.push(callback);
			},
			removeDisposeHandler: function (callback) {
				var idx = hot._disposeHandlers.indexOf(callback);
				if (idx > 0) {
					hot._disposeHandlers.splice(idx, 1);
				}
			},
			invalidate: function () {
				this._selfInvalidated = true;
				switch (currentStatus) {
					case "idle":
						// TODO: useless
						currentUpdateApplyHandlers = [];
						Object.keys(runtime.__rspack_require__.hmrI).forEach(function (
							key
						) {
							runtime.__rspack_require__.hmrI[key](
								moduleId,
								currentUpdateApplyHandlers
							);
						});
						setStatus("ready");
						break;
					case "ready":
						Object.keys(runtime.__rspack_require__.hmrI).forEach(function (
							key
						) {
							runtime.__rspack_require__.hmrI[key](
								moduleId,
								currentUpdateApplyHandlers
							);
						});
						break;
					case "prepare":
					case "check":
					case "dispose":
					case "apply":
						(queuedInvalidatedModules = queuedInvalidatedModules || []).push(
							moduleId
						);
						break;
					default:
						break;
				}
			},
			check: hotCheck,
			apply: hotApply,
			status: function (l) {
				if (!l) {
					return currentStatus;
				}
				registeredStatusHandlers.push(l);
			},
			addStatusHandler: function (l) {
				registeredStatusHandlers.push(l);
			},
			removeStatusHandler: function (l) {
				var idx = registeredStatusHandlers.indexOf(l);
				if (idx >= 0) registeredStatusHandlers.splice(idx, 1);
			},
			data: currentModuleData[moduleId]
		};
		currentChildModule = undefined;
		return hot;
	}

	function setStatus(newStats) {
		currentStatus = newStats;
		var results = [];
		for (var i = 0; i < registeredStatusHandlers.length; i++) {
			results[i] = registeredStatusHandlers[i].call(null, newStats);
		}
		return Promise.all(results);
	}

	function unblock() {
		if (--blockingPromises === 0) {
			setStatus("ready").then(function () {
				if (blockingPromises === 0) {
					var list = blockingPromisesWaiting;
					blockingPromisesWaiting = [];
					for (var i = 0; i < list.length; i++) {
						list[i]();
					}
				}
			});
		}
	}

	function trackBlockingPromise(promise) {
		switch (currentStatus) {
			case "ready":
				setStatus("prepare");
			case "prepare":
				blockingPromises++;
				promise.then(unblock, unblock);
				return promise;
			default:
				return promise;
		}
	}

	function waitForBlockingPromises(fn) {
		if (blockingPromises === 0) {
			return fn();
		}
		return new Promise(function (resolve) {
			blockingPromisesWaiting.push(function () {
				resolve(fn());
			});
		});
	}

	function hotCheck(applyOnUpdate) {
		if (currentStatus === "idle") {
			throw new Error("check() is only allowed in idle status");
		}
		return (
			setStatus("check")
				// .then(runtime.__rspack_require__.hmrM) // TODO: fetch is not needed
				.then(function (update) {
					if (!update) {
						return setStatus(applyInvalidatedModules() ? "ready" : "idle").then(
							function () {
								return null;
							}
						);
					}

					return setStatus("prepare").then(function () {
						var updatedModules = [];
						currentUpdateApplyHandlers = [];
						return Promise.all(
							Object.keys(runtime.__rspack_require__.hmrC).reduce(function (
								promises,
								key
							) {
								runtime.__rspack_require__.hmrC[key](
									update.c,
									update.r,
									update.m,
									promises,
									currentUpdateApplyHandlers,
									updatedModules
								);
							})
						).then(function () {
							return waitForBlockingPromises(function () {
								if (applyOnUpdate) {
									return internalApply(applyOnUpdate);
								} else {
									return setStatus("ready").then(function () {
										return updatedModules;
									});
								}
							});
						});
					});
				})
		);
	}

	function hotApply(options) {
		if (currentStatus !== "ready") {
			return Promise.resolve().then(function () {
				throw Error(
					"apply() is only allowed in ready status (state: " +
						currentStatus +
						")"
				);
			});
		}
		return internalApply(options);
	}

	function internalApply(options) {
		options = options || {};
		applyInvalidatedModules();
		var results = currentUpdateApplyHandlers.map(function (handler) {
			return handler(options);
		});
		currentUpdateApplyHandlers = undefined;
		var errors = results
			.map(function (r) {
				return r.errors;
			})
			.filter(Boolean);

		if (errors.length > 0) {
			return setStatus("abort").then(function () {
				throw errors[0];
			});
		}

		var disposePromise = setStatus("dispose");

		results.forEach(function (result) {
			if (result.dispose) {
				result.dispose();
			}
		});

		var applyPromise = setStatus("apply");

		var error;
		var reportError = function (err) {
			if (!error) {
				error = err;
			}
		};

		var outdatedModules = [];
		results.forEach(function (result) {
			if (result.apply) {
				var modules = result.apply(reportError);
				if (modules) {
					for (var i = 0; i < modules.length; i++) {
						outdatedModules.push(modules[i]);
					}
				}
			}
		});

		return Promise.all([disposePromise, applyPromise]).then(function () {
			if (error) {
				return setStatus("fail").then(function () {
					throw error;
				});
			}

			if (queuedInvalidatedModules) {
				return internalApply(options).then(function (list) {
					outdatedModules.forEach(function (moduleId) {
						if (list.indexOf(moduleId) < 0) {
							list.push(moduleId);
						}
					});
					return list;
				});
			}

			return setStatus("idle").then(function () {
				return outdatedModules;
			});
		});
	}

	function applyInvalidatedModules() {
		if (queuedInvalidatedModules) {
			if (!currentUpdateApplyHandlers) {
				currentUpdateApplyHandlers = [];
			}
			Object.keys(runtime.__rspack_require__.hmrI).forEach(function (key) {
				queuedInvalidatedModules.forEach(function (moduleId) {
					runtime.__rspack_require__.hmrI[key](
						moduleId,
						currentUpdateApplyHandlers
					);
				});
			});
			queuedInvalidatedModules = undefined;
			return true;
		}
	}
})();
 })();