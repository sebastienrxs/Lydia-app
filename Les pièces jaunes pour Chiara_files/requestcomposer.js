$(document).ready(function() {
    var gSubmittingForm = false;
    var gRefreshingForm = false;
    var gShouldRefreshForm = false;
    var gShouldProcessErrors = false;
    var gPaymentMethod = "auto";
    var gCheckingSubmissionStatus = false;
    var gShouldCheckSubmissionStatus = false;
    var gSubmittable = false;
    var gSubmittableMessage = "";

    setTimeout(function() {
        // set autocomplete if input is firstname + lastname
        var inputFullname = $('#fieldContainername-key input#name-key');
        if (inputFullname.length > 0) {
            inputFullname.attr('autocomplete', 'name');
        }

        // set autocomplete if input is phone number
        var inputPhoneNumber = $('.intl-tel-input input[type="tel"]');
        if (inputPhoneNumber.length > 0) {
            inputPhoneNumber.attr('autocomplete', 'tel-local');
        }
    }, 0)

    function switch_payment_control(source, target) {
        var targetSelector = '#' + target;
        var sourceSelector = '#' + source;
        if (!$(targetSelector).is(':visible')) {
            if ($(sourceSelector).is(':visible')) {
                $(sourceSelector).fadeOut(300, function () {
                        $(targetSelector).fadeIn(300);
                })
            } else {
                $(targetSelector).fadeIn(300);
            }
        }
    }

    function updateSubmissionStatus() {
        if (gCheckingSubmissionStatus) {
            return;
        }
        gCheckingSubmissionStatus = true;
        $.ajax({
            url: window.submissionStatus,
            type: "get",
            dataType: 'json',
            success: function(json) {
                gSubmittableMessage = json["message"];
                gSubmittable = json["submittable"];
            },
            error: function() {
                gSubmittable = false;
            },
            complete: function() {
                updateViewWithSubmission();
                setTimeout(function() {
                    gCheckingSubmissionStatus = false;
                    if (gShouldCheckSubmissionStatus) {
                        updateSubmissionStatus();
                    }
                }, window.refreshDelay * 1000);
            }
        });
    }

    function updateViewWithSubmission() {
        if (gSubmittable) {
            $("#submission-buttons-container").show();
            $("#wait-for-slot-container").hide();
        } else {
            $("#submission-buttons-container").hide();
            $("#wait-for-slot-container").show();
        }
        $(".pop-with-wait-label").html(gSubmittableMessage);
    }

    if (window.submissionStatus !== undefined) {
        gShouldCheckSubmissionStatus = true;
        gSubmittable = false;
        gSubmittableMessage = "En attente";
        updateSubmissionStatus();
    }

    function refreshForm() {
        if (gRefreshingForm || !gShouldRefreshForm) {
            return;
        }
        gShouldRefreshForm = false;
        gRefreshingForm = true;
        updateState();
        var f = $('#composer-form');
        $.ajax({
            url: f.attr('data-checkprice'),
            type: f.attr('method'),
            data: f.serialize(),
            dataType: 'json',
            success: function(json) {
                $("#amount-hidden-field").val(json['price']);
                if (json.price > 0 ) {
                    $("#amount-label").html(json['human_readable_price']);
                    if (!$(".amount").is(':visible')) {
                        $(".amount").slideDown(300);
                    }
                    switch_payment_control('payment-control-without-amount', 'payment-control-with-amount');
                } else {
                    if ($(".amount").is(':visible')) {
                        $(".amount").slideUp(300);
                    }
                    switch_payment_control('payment-control-with-amount', 'payment-control-without-amount');
                }

                $("*[id^='collect-form-']").prop('disabled', false);
                for (var i = 0; i < json.disabled_ids.length; i++) {
                    $("#" + json.disabled_ids[i]).prop('disabled', true);
                }
            },
            error: function() {
                gRefreshingForm = false;
                updateState();
            },
            complete: function(ret) {
                setTimeout(function() {
                    gRefreshingForm = false;
                    updateState();
                    if (gShouldRefreshForm) {
                        refreshForm();
                    }
                }, 300);
            }
        });
    }
    gShouldRefreshForm = true;
    setTimeout(function() {
      refreshForm();
    }, 100);

    $("select.refresh-form").change(function() {
        gShouldRefreshForm = true;
        setTimeout(function() {
          refreshForm();
        }, 100);
    });

    $("input.refresh-form").on('input',function() {
        const regExEmail = '^[\\w\\-+.]+@[\\w\\-.]+\\.\\w+$'
        const match = new RegExp(regExEmail)

        if ($(this).attr('type') === 'email' && !match.test($(this).val())) {
            return
        }

        gShouldRefreshForm = true;
        setTimeout(function() {
          refreshForm();
        }, 100);
    });

    $("#submit-phone-form-lydia").click(function(evt) {
        submitButton = $(this);
        if (submitButton.hasClass("disabled")) {
            evt.preventDefault();
            return;
        }
        gPaymentMethod = "lydia";
        sendForm('#composer-form');
        return false;
    });

    $("#submit-phone-form-cb").click(function(evt) {
        submitButton = $(this);
        if (submitButton.hasClass("disabled")) {
            evt.preventDefault();
            return;
        }

        gPaymentMethod = "cb";
        if (submitButton.attr('form-id')) {
            sendForm(submitButton.attr('form-id'));
            return false
        }
        sendForm('#composer-form');
        return false;
    });

    $("#submit-phone-form-noamount").click(function(evt) {
        submitButton = $(this);
        if (submitButton.hasClass("disabled")) {
            evt.preventDefault();
            return;
        }

        gPaymentMethod = "noamount";
        sendForm('#composer-form');
        return false;
    });

    $("#submit-phone-form-waiting-list").click(function(evt) {
        submitButton = $(this);
        if (submitButton.hasClass("disabled")) {
            evt.preventDefault();
            return;
        }
        gPaymentMethod = "none";
        sendForm('#composer-form');
        return false;
    });

    function updateState() {
        if (gSubmittingForm) {
            $(".submit-phone-form").attr("disabled", "disabled");
            if (gPaymentMethod == "cb") {
                $("#submit-state-cb").hide();
                $("#loader-state-cb").show();
            } else if (gPaymentMethod == "lydia") {
                $("#submit-state-lydia").hide();
                $("#loader-state-lydia").show();
            } else if (gPaymentMethod == "none") {
                $("#submit-state-waiting-list").hide();
                $("#loader-state-waiting-list").show();
            } else {
                $("#submit-state-cb").hide();
                $("#loader-state-cb").show();
                $("#submit-state-lydia").hide();
                $("#loader-state-lydia").show();
                $("#submit-state-waiting-list").hide();
                $("#loader-state-waiting-list").show();
            }
        } else {
            $(".submit-phone-form").removeAttr("disabled");
            $("#submit-state-lydia").show();
            $("#submit-state-cb").show();
            $("#submit-state-waiting-list").show();
            $("#loader-state-lydia").hide();
            $("#loader-state-cb").hide();
            $("#loader-state-waiting-list").hide();
        }

    }

    function hideIframe()
    {
        $("#overlay").fadeOut({
            duration: 100,
        });
        enableScrolling();
    }

    function showIframe(url)
    {
        setTimeout(function()
        {
            $("#overlay").fadeIn({
                duration: 100,
            });
        }, 200);
        $("#iframe").attr("src", url);
        disableScrolling();
    }

	function disableScrolling()
	{
		$('html, body').css({
		    'overflow': 'hidden',
		    'height': '100%'
		});
	}

	function enableScrolling()
	{
		$('html, body').css({
		    'overflow': 'auto',
		    'height': 'auto'
		});
	}

    function setError(message) {
        $("#error-container").html(message);
    }

    function setFieldValidity(fieldId, isValid) {
        if (isValid) {
            $("#field-container-" + fieldId).removeClass("has-error");
        } else {
            $("#field-container-" + fieldId).addClass("has-error");
        }
    }

    function markAllFieldsAsValid() {
        $(".form-line").removeClass("has-error");
    }

    function isInFrame() {
        if (window.location !== window.parent.location) {
            return true;
        } else {
            return false;
        }
    }

    function sendForm(formId) {
        if (gSubmittingForm) {
            return;
        }
        gSubmittingForm = true;
        updateState();
        var f = $(formId);

        if (window.isCagnotte) {
            try {
                analytics.track('participant-clicked-on-pay', {
                    'payment-method' : gPaymentMethod == 'cb' ? 'credit-card' : 'lydia',
                    'amount' : $('#amount-key').val(),
                    'payment-page-type' : 'cagnotte'
                });
            } catch(err) {}
        }
        $.ajax({
            url: f.attr('action'),
            type: f.attr('method'),
            data: f.serialize() + "&payment_method=" + gPaymentMethod,
            dataType: 'json',
            success: function(json) {
                markAllFieldsAsValid();
                setError("");
                if (json.error_message) {
                    setError(json.error_message);
                    var fields = json.invalid_fields || [];

                    for (var i = 0; i < fields.length; i++) {
                        setFieldValidity(fields[i], false);
                    }
                } else {
                    if (json.navigation_type === "blank" || isInFrame()) {
                        window.location = json.url;
                    } else {
                    	showIframe(json.url);
                    }
                }
            },
            error: function(json) {
                console.log(json);
                setError("une erreur est survenue, veuillez réessayer");
            },
            complete: function(ret) {
                gSubmittingForm = false;
                updateState();
            }
        });
    }

    updateState();
    setTimeout(function() {
        gShouldProcessErrors = true;
    }, 0);

    $('.date_input').datepicker({
        firstDay: 1
    });
    $(".int-phone-number").keyup(function(event) {
        var field = $(this),
        internationalNumber = field.intlTelInput("getNumber"),
        hiddenField = field.parent().parent().find(".int-phone-number-hidden");
        hiddenField.val(internationalNumber);
    }).change();

    $('.int-phone-number').on('change', function(e) {
        var c = $('.selected-flag').attr('title').split(': ');
        $('.ph-index').html(c[1]);
    });

    $('.ph-index').html(window.default_prefix_country.prefix || '+33');

    $("#close-share").click(function() {
        $(".composer-share-container").fadeOut();
        return false;
    });

    //$("#close-iframe").click(function() {
    //    hideIframe();
    //    return false;
    //});

	$("#overlay").click(function() {
        hideIframe();
        return false;
    });

    $(document).keyup(function(e) {
     	if (e.keyCode == 27)
     		hideIframe();
	});

    $('.upload-container .glyphicon-remove').click(function() {
        var self = $(this);

        $.ajax({
            url: $(this).data("url"),
            type: 'DELETE',
            success: function(result) {
                self.closest(".upload-container").find(".filename-holder").hide();
                self.closest(".upload-container").find(".glyphicon-remove").hide();
            }
        });
    });

    function setUploadedFile(rootEl, file) {
        var fileName = file.name.replace(/ \([^\)]{10}\)/g,"");
        if(fileName.length > 25) {
            fileName = fileName.substring(0,25-3)+"...";
        }
        rootEl.find(".file-id-holder").attr("value", file.name);
        rootEl.find(".filename-holder").text(fileName);
        rootEl.find(".filename-holder").show();
        rootEl.find(".glyphicon-remove").data("url", file.deleteUrl);
        rootEl.find(".glyphicon-remove").show();
    }

    function resetUploadedFile(rootEl) {
        rootEl.find(".filename-holder").hide();
        rootEl.find(".glyphicon-remove").hide();
        rootEl.find(".file-id-holder").attr("value", "");
        rootEl.find(".glyphicon-remove").data("url", "");
    }

    function setLoaderVisible(rootEl, isVisible) {
        if (isVisible) {
            rootEl.find(".upload-btn-content").hide();
            rootEl.find(".spinner").show();
            rootEl.find(".upload-btn").toggleClass("disabled", true);
        } else {
            rootEl.find(".upload-btn-content").show();
            rootEl.find(".spinner").hide();
        }
    }

    $('.file-input-field').fileupload({
        dataType: 'json',
        singleFileUploads: "true",
        maxNumberOfFiles: 1,
        add: function (e, data) {
            var currentCall = $(this).data("handler");
            if (currentCall) {
                resetUploadedFile($(this).closest(".upload-container"));
                currentCall.abort();
            }
            var jqXHR = data.submit();
            $(this).data("handler", jqXHR);
        },
        progress: function (e, data) {
            var isLoading = data.loaded != data.total;
            setLoaderVisible($(e.target).closest(".upload-container"), isLoading);
        },
        fail: function (e, data) {
            if (data.errorThrown != "abort") {
                alert(window.uploadError);
                resetUploadedFile($(e.target).closest(".upload-container"));
            }
        },
        done: function (e, data) {
            if (data.result.files.length == 0) {
                resetUploadedFile($(e.target).closest(".upload-container"));
                alert(window.uploadError);
                return;
            }
            $.each(data.result.files, function (index, file) {
                setUploadedFile($(e.target).closest(".upload-container"), file);
            });
        }
    });

});

$.datepicker.regional['fr'] = {
    clearText: 'Effacer',
    clearStatus: '',
    closeText: 'Fermer',
    closeStatus: 'Fermer sans modifier',
    prevText: '<Préc',
    prevStatus: 'Voir le mois précédent',
    nextText: 'Suiv>',
    nextStatus: 'Voir le mois suivant',
    currentText: 'Courant',
    currentStatus: 'Voir le mois courant',
    monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ],
    monthNamesShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
        'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
    ],
    monthStatus: 'Voir un autre mois',
    yearStatus: 'Voir un autre année',
    weekHeader: 'Sm',
    weekStatus: '',
    dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    dayNamesMin: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
    dayStatus: 'Utiliser DD comme premier jour de la semaine',
    dateStatus: 'Choisir le DD, MM d',
    dateFormat: 'dd/mm/yy',
    firstDay: 0,
    initStatus: 'Choisir la date',
    isRTL: false
};
$.datepicker.setDefaults($.datepicker.regional['fr']);
