var xBrowserSync = xBrowserSync || {};
xBrowserSync.App = xBrowserSync.App || {};

/* ------------------------------------------------------------------------------------
 * Class name:  xBrowserSync.App.Controller 
 * Description: Main controller for the app.
 * ------------------------------------------------------------------------------------ */

xBrowserSync.App.Controller = function($scope, $q, $timeout, platform, global, api, utility, bookmarks, platformImplementation) { 
	'use strict';    
    var vm;
    
/* ------------------------------------------------------------------------------------
 * Constructor
 * ------------------------------------------------------------------------------------ */
 
    var BrowserAction = function() {
        vm = this;
        vm.global = global;
        vm.platform = platform; 
		
		vm.alert = {
			show: false,
			title: '',
			message: '',
			type: '',
			display: function(title, message, alertType) {
				vm.alert.title = title;
				vm.alert.message = message;
				vm.alert.type = alertType;
				vm.alert.show = true;
			}
		};
        
        vm.bookmark = {
            active: false,
            current: null,
            displayUpdateForm : false,
            tagText: null
        };
        
        vm.domElements = {
            btnRestoreData: function() {
                if (!vm.settings.dataToRestore) {
                    return platform.Constants.Get(global.Constants.Button_RestoreData_Label);
                }
                
                if (!vm.settings.dataToRestoreIsValid()) {
                    return platform.Constants.Get(global.Constants.Button_RestoreData_Invalid_Label);
                }
                
                return platform.Constants.Get(global.Constants.Button_RestoreData_Ready_Label);
            },
            btnSync: function() {
                if (vm.sync.enabled()) {
                    if (vm.domElements.btnSync_hover) {
                        return platform.Constants.Get(global.Constants.Button_Sync_Disable_Label);
                    }
                    
                    return platform.Constants.Get(global.Constants.Button_Sync_Enabled_Label);
                }
                
                return platform.Constants.Get(global.Constants.Button_Sync_Enable_Label);
            },
            btnSync_hover: false
        };
        
        vm.events = {
            backupRestoreForm_Backup_Click: backupRestoreForm_Backup_Click,
            backupRestoreForm_Restore_Click: backupRestoreForm_Restore_Click,
            bookmarkForm_BookmarkDescription_Change: bookmarkForm_BookmarkDescription_Change,
            bookmarkForm_BookmarkTags_Change: bookmarkForm_BookmarkTags_Change,
            bookmarkForm_BookmarkTags_KeyDown: bookmarkForm_BookmarkTags_KeyDown,
            bookmarkForm_BookmarkUrl_Change: bookmarkForm_BookmarkUrl_Change,
            bookmarkForm_CreateBookmark_Click: bookmarkForm_CreateBookmark_Click,
            bookmarkForm_CreateTags_Click: bookmarkForm_CreateTags_Click,
            bookmarkForm_DeleteBookmark_Click: bookmarkForm_DeleteBookmark_Click,
            bookmarkForm_RemoveTag_Click: bookmarkForm_RemoveTag_Click,
            bookmarkForm_UpdateBookmark_Click: bookmarkForm_UpdateBookmark_Click,
            searchForm_SearchText_Change: searchForm_SearchText_Change,
            searchForm_SearchText_KeyDown: searchForm_SearchText_KeyDown,
            searchForm_SearchResult_KeyDown: searchForm_SearchResult_KeyDown,
            searchForm_UpdateBookmark_Click: searchForm_UpdateBookmark_Click,
            syncForm_Confim_Click: syncForm_Confim_Click,
            syncForm_Sync_Click: syncForm_Sync_Click,
            toggleBookmark_Click: toggleBookmark_Click,
            updateServiceUrlForm_Display_Click: updateServiceUrlForm_Display_Click,
            updateServiceUrlForm_Update_Click: updateServiceUrlForm_Update_Click
        };
        
        vm.hints = {
            introduction: false,
            show: function(value) {
                return arguments.length ? 
                    global.ShowHints.Set(value) : 
                    global.ShowHints.Get();
            },
            toggle: function() {
                if (!!vm.hints.toggleTimeout) {
                    $timeout.cancel(vm.hints.toggleTimeout);
                    vm.hints.toggleTimeout = null;
                }
                else {
                    vm.hints.toggleTimeout = $timeout(function() {
                        vm.hints.show(!vm.hints.show());
                    }, 2000);
                }
            },
            toggleTimeout: null
        };
        
        vm.search = {
            getLookaheadTimeout: null,
            getResultsTimeout: null,
            lastWord: null,
            lookahead: null,
            query: null,
            results: null
        };
        
		vm.settings = {
			backupRestoreResult: null,
            dataToRestore: null,
            dataToRestoreIsValid: function() {
                return checkRestoreData(vm.settings.dataToRestore);
            },
			displayRestoreConfirmation: false,
            displayRestoreForm: false,
			id: function(value) {
                return arguments.length ? 
                    global.Id.Set(value) : 
                    global.Id.Get();
            },
            includeBookmarksBar: function(value) {
                return arguments.length ? 
                    global.IncludeBookmarksBar.Set(value) : 
                    global.IncludeBookmarksBar.Get();
            },
			secret: function(value) {
                return arguments.length ? 
                    global.ClientSecret.Set(value) : 
                    global.ClientSecret.Get();
            },
            service: {
                displayUpdateServiceUrlForm: false,
                newServiceUrl: '',
                status: global.ServiceStatus.Online,
                statusMessage: '',
                url: function(value) {
                    return arguments.length ? 
                        global.URL.Host.Set(value) : 
                        global.URL.Host.Get();
                }
            },
            panels: { sync: 0, serviceStatus: 1, backupRestore: 2 },
            visiblePanel: null
		};
		
		vm.sync = {
			asyncChannel: undefined,
            enabled: function(value) {
                return arguments.length ? 
                    global.SyncEnabled.Set(value) : 
                    global.SyncEnabled.Get();
            },
            inProgress: function(value) {
                return arguments.length ? 
                    global.IsSyncing.Set(value) : 
                    global.IsSyncing.Get();
            },
            interrupted: function(value) {
                return arguments.length ? 
                    global.SyncInterrupted.Set(value) : 
                    global.SyncInterrupted.Get();
            },
            showConfirmation: false
		};

		vm.view = {
			current: null,
			change: function(view) {
				// Reset view
                vm.view.reset();
                
                if (view === vm.view.views.main) {
					if (!!global.SyncEnabled.Get()) {
                        // Focus on search bar
                        $timeout(function() {
                            document.querySelector('input[name=txtSearch]').select();
                        }, 200);
                    }
                    else {
                        view = vm.view.views.login;
                    }
                    
                    // Display introduction
                    if (vm.hints.show()) {
                        $timeout(function() {
                            vm.hints.introduction = true;
                        }, 500);
                    }
				}
                
                if (view === vm.view.views.login) {
                    $timeout(function() {
                        document.querySelector('input[name=txtClientSecret]').select();
                    });
                }
                
                if (view === vm.view.views.bookmark) {
                    // Reset
                    if (vm.bookmarkForm) {
                        vm.bookmarkForm.$setPristine();
                        vm.bookmarkForm.$setUntouched();
                        vm.bookmarkForm.bookmarkUrl.$setValidity('InvalidUrl', true);
                    }
                    
                    // Focus on title field
                    $timeout(function() {
                        document.querySelector('input[name="bookmarkTitle"]').select();
                    }, 100);
                }
                
                if (view === vm.view.views.settings) {
                    // Set visible panel to sync panel
                    vm.settings.visiblePanel = vm.settings.panels.sync;
                    
                    // Get service status
                    utility.CheckServiceStatus()
                        .then(function(response) {
                            vm.settings.service.status = response.status;
                            vm.settings.service.statusMessage = response.message;
                        })
                        .catch(function(err) {
                            vm.settings.service.status = global.ServiceStatus.Offline;
                        });
                    
                    // If sync is enabled, generate a QR code 
                    if (global.SyncEnabled.Get()) {
                        generateQRCode();
                    }
                }
				
				vm.view.current = view;
			},
            reset: function() {
                vm.alert.show = false;
                vm.hints.introduction = false;
                vm.working = false;
                
                vm.sync.interrupted(false);
                vm.sync.showConfirmation = false;
                if (vm.syncForm) {
                    vm.syncForm.$setPristine();
                    vm.syncForm.$setUntouched();
                }
                    
                vm.settings.service.displayUpdateServiceUrlForm = false;
                vm.settings.service.newServiceUrl = vm.settings.service.url();
                vm.settings.backupRestoreResult = null;
                vm.settings.displayRestoreForm = false;
                vm.settings.displayRestoreConfirmation = false;
                vm.settings.dataToRestore = '';
                if (vm.updateServiceUrlForm) {
                    vm.updateServiceUrlForm.txtServiceUrl.$setValidity('InvalidService', true);
                }
                
                vm.search.lookahead = null;
                vm.search.query = null;
                vm.search.results = null;
            },
            views: { login: 0, main: 1, bookmark: 2, settings: 3 }
		};
        
        vm.working = false;
        
        // Initialise the app
        init();
    };
        
        
/* ------------------------------------------------------------------------------------
 * Private functions
 * ------------------------------------------------------------------------------------ */
	
	var backupRestoreForm_Backup_Click = function() {
		// Export bookmarks
		bookmarks.Export()
            .then(function(data) {
				var blob = new Blob(
					[JSON.stringify(data)], {
						type: 'application/json' });
				
				var date = new Date();
				var second = ('0' + date.getSeconds()).slice(-2);
				var minute = ('0' + date.getMinutes()).slice(-2);
				var hour = ('0' + date.getHours()).slice(-2);
				var day = ('0' + date.getDate()).slice(-2);
				var month = ('0' + (date.getMonth() + 1)).slice(-2);
				var year = date.getFullYear();
				var dateString = year + month + day + hour + minute + second;
				
				// Trigger download 
				var exportUrl = window.URL.createObjectURL(blob);
                var backupLink = document.getElementById('backupLink');
                var fileName = 'xBrowserSyncExport_' + dateString + '.txt';
                backupLink.setAttribute('download', fileName);
				backupLink.setAttribute('href', exportUrl);
				backupLink.click();
                
                // Display message
                var message = platform.Constants.Get(global.Constants.BackupSuccess_Message).replace(
                    '{fileName}',
                    fileName);
                
                vm.settings.backupRestoreResult = message;
			})
            .catch(function(err) {
				// Display alert
				var errMessage = utility.GetErrorMessageFromException(err);
				vm.alert.display(errMessage.title, errMessage.message, 'danger');
			});
	};
	
	var backupRestoreForm_Restore_Click = function(data) {
		if (!data) {
            // Display alert
            vm.alert.display(
                platform.Constants.Get(global.Constants.Error_NoDataToRestore_Title),
                platform.Constants.Get(global.Constants.Error_NoDataToRestore_Message), 
                'danger');
            
            return;
        }
        
        // Show loading animation
        vm.working = true;
        
        // Start restore
        restoreData(JSON.parse(data));
	};
    
    var bookmarkForm_BookmarkDescription_Change = function() {
        // Limit the bookmark description to the max length
        if (!!vm.bookmark.current.Description && vm.bookmark.current.Description.length > global.Bookmark.DescriptionMaxLength) {
            vm.bookmark.current.Description = vm.bookmark.current.Description.substring(0, global.Bookmark.DescriptionMaxLength);
        }
    };
    
    var bookmarkForm_CreateBookmark_Click = function() {
        // Return if the form is not valid
		if (!vm.bookmarkForm.$valid) {
			document.querySelector('#bookmarkForm .ng-invalid').select();
            return;
		}
        
        // Add the bookmark
        platform.Sync(vm.sync.asyncChannel, {
            type: global.SyncType.Both,
            changeInfo: { 
                type: global.UpdateType.Create, 
                bookmark: vm.bookmark.current 
            }
        });
        
        // Set bookmark active status
        vm.bookmark.active = true;
        
        // Display the main view
        vm.view.change(vm.view.views.main);
    };
    
    var bookmarkForm_CreateTags_Click = function() {
        // Clean and sort tags and add them to tag array
        var newTags = getTagArrayFromText(vm.bookmark.tagText);
        
        vm.bookmark.current.Tags = _.sortBy(_.union(newTags, vm.bookmark.current.Tags), function(tag) {
            return tag;
        });
        
        // Clear tag field and return focus
        vm.bookmark.tagText = '';
        document.querySelector('input[name="bookmarkTags"]').focus();
    };
    
    var bookmarkForm_DeleteBookmark_Click = function() {
        // Get current page url
		platform.CurrentUrl.Get()
            .then(function(currentUrl) {
                if (!currentUrl) {
                    return $q.reject({ code: global.ErrorCodes.FailedGetPageMetadata });
                }
                
                // Delete the bookmark
                platform.Sync(vm.sync.asyncChannel, {
                    type: global.SyncType.Both,
                    changeInfo: { 
                        type: global.UpdateType.Delete, 
                        url: vm.bookmark.current.originalUrl
                    }
                });
                
                // Set bookmark active status if current bookmark is current page 
                if (currentUrl === vm.bookmark.current.originalUrl) {
                    vm.bookmark.active = false;
                }
                
                // Display the main view
                vm.view.change(vm.view.views.main);
            })
            .catch(function(err) {
                // Display alert
                var errMessage = utility.GetErrorMessageFromException(err);
                vm.alert.display(errMessage.title, errMessage.message, 'danger');
            });
    };
    
    var bookmarkForm_BookmarkTags_Change = function() {
        // Hide alerts
        vm.alert.show = false;
        
        // Clear lookahead
        vm.bookmark.tagLookahead = null;
        
        if (vm.bookmark.tagText.length > 1) {
            // Get last word of tag text
            var matches = vm.bookmark.tagText.match(/[\w]+$/);
            var lastWord = (!!matches) ? matches[0] : null;
            
            // Get tags lookahead
            if (!!lastWord) {
                bookmarks.Lookahead(lastWord, null, true)
                    .then(function(results) {
                        if (!results) {
                            return;
                        }
                        
                        var lookahead = results[0];
                        var word =  results[1];
                        
                        // Display lookahead
                        if (!!lookahead && word === lastWord) {
                            vm.bookmark.tagLookahead = lookahead;                        
                            $timeout(function() {
                                var measure = document.querySelector('#bookmarkForm span.measure');
                                var element = document.querySelector('#bookmarkForm span.lookahead');
                                element.style.left = measure.offsetLeft + measure.offsetWidth + 'px';
                            });
                        }
                    });
            }
        }
    };
    
    var bookmarkForm_BookmarkTags_KeyDown = function($event) {
        switch (true) {
            // If user pressed Enter
            case ($event.keyCode === 13):
                // Add new tags
                $event.preventDefault();
                vm.events.bookmarkForm_CreateTags_Click();            
                break;
            // If user pressed tab or right arrow key and lookahead present
            case (($event.keyCode === 9 || $event.keyCode === 39) && !!vm.bookmark.tagLookahead):
                // Add lookahead to search query
                $event.preventDefault();
                vm.bookmark.tagText += vm.bookmark.tagLookahead;
                bookmarkForm_BookmarkTags_Change();
                break;
        }
    };
    
    var bookmarkForm_BookmarkUrl_Change = function() {
        // Reset invalid service validator
        vm.bookmarkForm.bookmarkUrl.$setValidity('InvalidUrl', true);
        
        if (!vm.bookmark.url) {
            return;
        }
        
        // Check url is valid
        var matches = vm.bookmark.url.match(/^https?:\/\/\w+/i);
        var urlValid = (!!matches && matches.length > 0) ? true: false;
        
        if (!matches || matches.length <= 0) {
            vm.bookmarkForm.bookmarkUrl.$setValidity('InvalidUrl', false);
        }
    };
    
    var bookmarkForm_RemoveTag_Click = function(tag) {
        vm.bookmark.current.Tags = _.without(vm.bookmark.current.Tags, tag);
        document.querySelector('#bookmarkForm input[name="bookmarkTags"]').focus()
    };
    
    var bookmarkForm_UpdateBookmark_Click = function() {
        // Return if the form is not valid
		if (!vm.bookmarkForm.$valid) {
			document.querySelector('#bookmarkForm .ng-invalid').select();
            return;
		}
        
        // Get current page url
		platform.CurrentUrl.Get()
            .then(function(currentUrl) {
                if (!currentUrl) {
                    return $q.reject({ code: global.ErrorCodes.FailedGetPageMetadata });
                }
                
                // Update the bookmark
                platform.Sync(vm.sync.asyncChannel, {
                    type: global.SyncType.Both,
                    changeInfo: { 
                        type: global.UpdateType.Update, 
                        url: vm.bookmark.current.originalUrl, 
                        bookmark: vm.bookmark.current
                    }
                });
                
                // Set bookmark active status if current bookmark is current page 
                if (currentUrl === vm.bookmark.current.originalUrl) {
                    vm.bookmark.active = (currentUrl === vm.bookmark.current.Url);
                }
                
                // Display the main view
                vm.view.change(vm.view.views.main);
            })
            .catch(function(err) {
                // Display alert
                var errMessage = utility.GetErrorMessageFromException(err);
                vm.alert.display(errMessage.title, errMessage.message, 'danger');
            });
    };
	
	var checkRestoreData = function(data) {
		var validData = false;
		
		if (!!data) {
			try {
				data = JSON.parse(data);
				
				if (!!data.xBrowserSync && !!data.xBrowserSync.bookmarks) {
					validData = true;
				}
			}
			catch(err) { }
		}
		
		return validData;
	};
    
    var generateQRCode = function() {
        var qr = qrcode(2, 'M');
        qr.addData(vm.settings.id());
        qr.make();

        document.getElementById('qr').innerHTML =  qr.createImgTag();
    };
    
    var getTagArrayFromText = function(tagText) {
        if (!tagText) {
            return null;
        }
        
        // Conver to lowercase and split tags into array
        var tags = tagText.toLowerCase().replace(/[^(\w|\s|,|\-)]/g, '').split(',');
        
        // Clean and sort tags
        tags = _.chain(tags)
            .map(function(tag) {
                return tag.trim();
            })
            .compact()
            .sortBy(function(tag) {
                return tag;
            })
            .value();
        
        return tags;
    };
    
    var handleSyncResponse = function(response) {
        var errMessage;
        
        switch(response.command) {
            case global.Commands.SyncBookmarks:
                if (response.success) {
                    // Display the main view
                    vm.view.change(vm.view.views.main);
                }
                else {
                    // Display alert
                    errMessage = utility.GetErrorMessageFromException(response.error);
                    vm.alert.display(errMessage.title, errMessage.message, 'danger');
                }
                
                // Hide loading animation
                vm.working = false;
                
                // Hide sync confirmation
                vm.sync.showConfirmation = false;
                break;
            case global.Commands.RestoreBookmarks:
                if (response.success) {
                    // Display message
                    vm.view.reset();
                    vm.settings.backupRestoreResult = platform.Constants.Get(global.Constants.RestoreSuccess_Message);
                }
                else {
                    // Display alert
                    errMessage = utility.GetErrorMessageFromException(response.error);
                    vm.alert.display(errMessage.title, errMessage.message, 'danger');
                }
                
                // Hide loading animation
                vm.working = false;
                break;
        }
    };
    
    var init = function() {
        // Get async channel for syncing in background
        vm.sync.asyncChannel = platform.AsyncChannel.Get(function(msg) {
            $scope.$apply(function() {
                handleSyncResponse(msg);
            });
        });
        
        // Add unload event listener to cleanup sync if in progress
        addEventListener('unload', function (event) {
            if (vm.sync.inProgress()) {
                vm.sync.inProgress(false);
                vm.sync.interrupted(true);
                vm.sync.enabled(false);
            }            
        }, true);
        
        // Enable event listeners
        global.DisableEventListeners.Set(false);
        
        // Set bookmark status
        setBookmarkStatus()
            .catch(function(err) {
				// Display alert
				var errMessage = utility.GetErrorMessageFromException(err);
				vm.alert.display(errMessage.title, errMessage.message, 'danger');
			});
        
        // Display the main view
        vm.view.change(vm.view.views.main);
    };
	
	var restoreData = function(data, restoreCallback) {
		// Set ID and client secret if sync not enabled
        if (!global.SyncEnabled.Get()) {
            global.ClientSecret.Set('');
            
            if (!!data.xBrowserSync.id) {
                global.Id.Set(data.xBrowserSync.id);
            }
		}
        
        var bookmarksToRestore = data.xBrowserSync.bookmarks;
        
		// Return if no bookmarks found
		if (!bookmarksToRestore) {
            return restoreCallback();
        }
        
        var syncData = {};
        syncData.type = (!global.SyncEnabled.Get()) ? global.SyncType.Pull : global.SyncType.Both;
        syncData.bookmarks = bookmarksToRestore;
        
        // Show loading animation
        vm.working = true;
        
        // Start restore
        platform.Sync(vm.sync.asyncChannel, syncData, global.Commands.RestoreBookmarks);
	};
    
    var searchBookmarks = function() {
        bookmarks.Search({ keywords: vm.search.query })
            .then(function(results) {
                vm.search.results = results;
                
                if (!!results && results.length > 0) {
                    $timeout(function() {
                        // Focus on first search result
                        document.querySelector('.search-results-panel .list-group').firstElementChild.firstElementChild.focus();
                    });
                }
            })
            .catch(function(err) {
                vm.search.results = null;
                
                // Display alert
                var errMessage = utility.GetErrorMessageFromException(err);
                vm.alert.display(errMessage.title, errMessage.message, 'danger');
            });
    };
    
    var searchForm_SearchText_Change = function() {
        // Hide alerts
        vm.alert.show = false;
        
        // Clear lookahead
        vm.search.lookahead = null;
        
        // Clear timeout
        if (!!vm.search.getResultsTimeout) {
            $timeout.cancel(vm.search.getResultsTimeout);
            vm.search.getResultsTimeout = null;
        }
        
        if (vm.search.query.length > 2) {
            // Get last word of search query
            var matches = vm.search.query.match(/[\w]+$/);
            vm.search.lastWord = (!!matches) ? matches[0] : null;
            
            // Get lookahead
            if (!!vm.search.lastWord) {
                bookmarks.Lookahead(vm.search.lastWord, vm.search.results)
                    .then(function(results) {
                        if (!results) {
                            return;
                        }
                        
                        var lookahead = results[0];
                        var word =  results[1];
                        
                        // Display lookahead
                        if (!!lookahead && word === vm.search.lastWord) {
                            vm.search.lookahead = lookahead;                        
                            $timeout(function() {
                                var measure = document.querySelector('.search-form span.measure');
                                var element = document.querySelector('.search-form span.lookahead');
                                element.style.left = measure.offsetLeft + measure.offsetWidth + 'px';
                            });
                        }
                    });
            }
            
            vm.search.getResultsTimeout = $timeout(function() {
                // Search bookmarks
                searchBookmarks();
            }, 1000);
        }
        else {
            vm.search.results = null;
        }
    };
    
    var searchForm_SearchText_KeyDown = function($event) {
        // If user pressed enter
        if ($event.keyCode === 13) {
            if (!!vm.search.getResultsTimeout) {
                $timeout.cancel(vm.search.getResultsTimeout);
                vm.search.getResultsTimeout = null;
            }
            
            searchBookmarks();
            return;
        }
        
        // If user pressed down arrow and search results present
        if ($event.keyCode === 40 && !!vm.search.results && vm.search.results.length > 0) {
            // Focus on first search result
            $event.preventDefault();
            document.querySelector('.search-results-panel .list-group').firstElementChild.firstElementChild.focus();
            return;
        }
        
        // If user pressed tab or right arrow key and lookahead present
        if (($event.keyCode === 9 || $event.keyCode === 39) && !!vm.search.lookahead) {
            // Add lookahead to search query
            $event.preventDefault();
            vm.search.query += vm.search.lookahead;
            searchForm_SearchText_Change();
            return;
        }
    };
    
    var searchForm_SearchResult_KeyDown = function($event) {
        var currentIndex, newIndex;
        
        switch (true) {
            // Up arrow
            case ($event.keyCode === 40):
                $event.preventDefault();
            
                if (!!$event.target.parentElement.nextElementSibling) {
                    // Focus on next result
                    $event.target.parentElement.nextElementSibling.firstElementChild.focus();
                }
                
                break;
            // Down arrow
            case ($event.keyCode === 38):
                $event.preventDefault();
            
                if (!!$event.target.parentElement.previousElementSibling) {
                    // Focus on previous result
                    $event.target.parentElement.previousElementSibling.firstElementChild.focus();
                }
                
                break;
            // Page up
            case ($event.keyCode === 33):
                $event.preventDefault();
            
                // Focus on result 6 down from current
                currentIndex = _.indexOf($event.target.parentElement.parentElement.children, $event.target.parentElement);
                newIndex = currentIndex - 6;
                
                if (newIndex < 0) {
                    $event.target.parentElement.parentElement.firstElementChild.firstElementChild.focus();
                }
                else {
                    $event.target.parentElement.parentElement.children[newIndex].firstElementChild.focus();
                }
                
                break;
            // Page down
            case ($event.keyCode === 34):
                $event.preventDefault();
                
                // Focus on result 6 down from current
                currentIndex = _.indexOf($event.target.parentElement.parentElement.children, $event.target.parentElement);
                newIndex = currentIndex + 6;
                
                if ($event.target.parentElement.parentElement.children.length < newIndex) {
                    $event.target.parentElement.parentElement.lastElementChild.firstElementChild.focus();
                }
                else {
                    $event.target.parentElement.parentElement.children[newIndex].firstElementChild.focus();
                }
                
                break;
            // Home
            case ($event.keyCode === 36):
                $event.preventDefault();
            
                // Focus on first result
                $event.target.parentElement.parentElement.firstElementChild.firstElementChild.focus();
                
                break;
            // End
            case ($event.keyCode === 35):
                $event.preventDefault();
            
                // Focus on last result
                $event.target.parentElement.parentElement.lastElementChild.firstElementChild.focus();
                
                break;
            // Backspace
            case ($event.keyCode === 8):
            // Space
            case ($event.keyCode === 32):
            // Numbers and letters
            case ($event.keyCode > 47 && $event.keyCode < 112):
                // Focus on search box
                document.querySelector('.search-form input').focus();
                break;
        }
    };
    
    var searchForm_UpdateBookmark_Click = function(bookmark) {
        vm.bookmark.current = bookmark;
        vm.bookmark.current.originalUrl = vm.bookmark.current.Url; 
        vm.bookmark.displayUpdateForm = true;
        
        // Display bookmark panel
        $timeout(function() {
            vm.view.change(vm.view.views.bookmark);
        }, 100);
    };
    
    var setBookmarkStatus = function() {
        if (!global.SyncEnabled.Get()) {
            return $q.resolve();
        }
        
        // Get bookmark active status and current page metadata
        return $q.all([
            platform.Bookmarks.ContainsCurrentPage(), 
            platform.PageMetadata.Get()
        ])
            .then(function(data) {
                if (!data) {
                    return $q.reject();
                }
                
                vm.bookmark.active = data[0];
                var metadata = data[1];
                
                if (vm.bookmark.active) {
                    // Get existing bookmark info
                    return bookmarks.Search({ url: metadata.url })
                        .then(function(result) {
                            if (!result) {
                                return $q.reject({ code: global.ErrorCodes.FailedFindBookmark });
                            }
                            
                            var bookmark = new utility.Bookmark(
                                result.Title, 
                                result.Url, 
                                result.Description,
                                result.Tags);
                            
                            vm.bookmark.current = bookmark;
                            vm.bookmark.current.originalUrl = bookmark.Url;
                            
                            // Display update form
                            vm.bookmark.displayUpdateForm = true;
                        });
                }
                else {
                    if (!metadata) {
                        return;
                    }
                    
                    // Get current page info
                    var bookmark = new utility.Bookmark(
                        metadata.title, 
                        metadata.url, 
                        metadata.description,
                        getTagArrayFromText(metadata.tags));
                    
                    vm.bookmark.current = bookmark;
                    
                    // Display add form
                    vm.bookmark.displayUpdateForm = false;
                }
            });
    };
	
	var syncForm_Confim_Click = function() {
        // Show loading animation
        vm.working = true;
        
        var syncData = {};
        syncData.type = (!global.Id.Get()) ? global.SyncType.Push : global.SyncType.Pull; 
        
        // Start sync
        platform.Sync(vm.sync.asyncChannel, syncData);
    };
    
    var syncForm_Sync_Click = function() {
		// Return if the form is not valid
		if (!vm.syncForm.txtClientSecret.$valid) {
			document.querySelector('[name=txtClientSecret]').select();
            return;
		}
		
		// Exit if a sync is currently in progress
        if (global.IsSyncing.Get()) {
            return;
        }
        
        // Toggle sync
        if (global.SyncEnabled.Get()) {
            // Set syncing state
		    global.SyncEnabled.Set(false);
        }
        else {
            // If ID provided, display confirmation panel
            if (!!global.Id.Get()) {
                vm.sync.showConfirmation = true;
            }
            else {
                // Otherwise start sync
				syncForm_Confim_Click();
            }
        }
	};
    
    var toggleBookmark_Click = function() {
        // Display bookmark panel
        vm.view.change(vm.view.views.bookmark);
        
        // Show loading animation
        vm.working = true;
        
        // Set bookmark status
        setBookmarkStatus()
            .then(function() {
                // Hide loading animation
                vm.working = false;
            })
            .catch(function(err) {
                // Display alert
                var errMessage = utility.GetErrorMessageFromException(err);
                vm.alert.display(errMessage.title, errMessage.message, 'danger');
            });
    };
    
    var updateServiceUrlForm_Display_Click = function() {
        // Reset view
        vm.view.reset();
        
        // Display update form panel
        vm.settings.service.displayUpdateServiceUrlForm = true;
        
        // Focus on url field
        $timeout(function() {
            document.querySelector('input[name="txtServiceUrl"]').select();            
        });
    };
	
	var updateServiceUrlForm_Update_Click = function() {
        // Reset invalid service validator
        vm.updateServiceUrlForm.txtServiceUrl.$setValidity('InvalidService', true);
        
        // Return if the form is not valid
		if (!vm.updateServiceUrlForm.txtServiceUrl.$valid) {
			document.querySelector('[name=txtServiceUrl]').select();
            return;
		}
        
        // Check service url
        var url = vm.settings.service.newServiceUrl.replace(/\/$/, '');
        
        utility.CheckServiceStatus(url)
            .then(function(response) {
                // Disable sync
                vm.sync.enabled(false);
                
                // Update the service URL
                vm.settings.service.url(url);
                
                // Remove saved client secret and ID
                global.ClientSecret.Set('');
                global.Id.Set('');
                
                // Update service status
                utility.CheckServiceStatus()
                    .then(function(response) {
                        vm.settings.service.status = response.status;
                        vm.settings.service.statusMessage = response.message;
                    })
                    .catch(function(err) {
                        vm.settings.service.status = global.ServiceStatus.Offline;
                    });
                
                // Reset view
                vm.view.reset();
            })
            .catch(function(err) {
                vm.updateServiceUrlForm.txtServiceUrl.$setValidity('InvalidService', false);
                document.querySelector('[name=txtServiceUrl]').select();
            });
    };
	
	// Call constructor
    return new BrowserAction();
};


/* ------------------------------------------------------------------------------------
 * Initialisation
 * ------------------------------------------------------------------------------------ */

// Initialise the angular app
var xBrowserSyncApp = angular.module('xBrowserSyncApp', ['ngSanitize', 'ngAnimate']);

// Disable debug info
xBrowserSyncApp.config(['$compileProvider', function($compileProvider) {
  $compileProvider.debugInfoEnabled(false);
}]);

// Add platform service
xBrowserSyncApp.factory('platform', xBrowserSync.App.Platform);

// Add global service
xBrowserSync.App.Global.$inject = ['platform'];
xBrowserSyncApp.factory('global', xBrowserSync.App.Global);

// Add api service
xBrowserSync.App.API.$inject = ['$http', '$q', 'global'];
xBrowserSyncApp.factory('api', xBrowserSync.App.API);

// Add utility service
xBrowserSync.App.Utility.$inject = ['$q', 'platform', 'global', 'api'];
xBrowserSyncApp.factory('utility', xBrowserSync.App.Utility);

// Add bookmarks service
xBrowserSync.App.Bookmarks.$inject = ['$q', 'platform', 'global', 'api', 'utility'];
xBrowserSyncApp.factory('bookmarks', xBrowserSync.App.Bookmarks);

// Add platform implementation service
xBrowserSync.App.PlatformImplementation.$inject = ['$q', '$timeout', 'platform', 'global', 'utility'];
xBrowserSyncApp.factory('platformImplementation', xBrowserSync.App.PlatformImplementation);

// Add main controller
xBrowserSync.App.Controller.$inject = ['$scope', '$q', '$timeout', 'platform', 'global', 'api', 'utility', 'bookmarks', 'platformImplementation'];
xBrowserSyncApp.controller('Controller', xBrowserSync.App.Controller);